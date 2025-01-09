import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as natural from 'natural';
import { BlogPost } from '../entities/post.entity';
import { Category } from '../entities/category.enitity';

@Injectable()
export class BlogAnalyzerService implements OnModuleInit {
    private tokenizer: natural.WordTokenizer;
    private classifier: natural.BayesClassifier;
    private tfidf: natural.TfIdf;

    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(BlogPost)
        private blogPostRepository: Repository<BlogPost>
    ) {
        this.tokenizer = new natural.WordTokenizer();
        this.classifier = new natural.BayesClassifier();
        this.tfidf = new natural.TfIdf();
    }

    async onModuleInit() {
        // Alkalmazás indításkor betanítjuk a modellt a meglévő posztokkal
        await this.trainClassifierFromExistingPosts();
    }

    private async trainClassifierFromExistingPosts() {
        const posts = await this.blogPostRepository.find({
            relations: ['categories']
        });

        // TF-IDF számítás minden kategóriához
        const categoryKeywords = new Map<string, Set<string>>();

        // Először összegyűjtjük a kategóriánkénti dokumentumokat
        for (const post of posts) {
            for (const category of post.categories) {
                const content = this.prepareContent(post);
                this.tfidf.addDocument(content, category.name);
            }
        }

        // Minden kategóriához kigyűjtjük a legfontosabb kulcsszavakat
        const categories = await this.categoryRepository.find();
        for (let i = 0; i < categories.length; i++) {
            const category = categories[i];
            const keywords = new Set<string>();
            
            this.tfidf.listTerms(i).slice(0, 20).forEach(item => {
                keywords.add(item.term);
            });
            
            categoryKeywords.set(category.name, keywords);
        }

        // Betanítjuk a klasszifikátort a talált kulcsszavakkal
        for (const post of posts) {
            const content = this.prepareContent(post);
            for (const category of post.categories) {
                this.classifier.addDocument(content, category.name);
            }
        }

        // Ha van elég adat, betanítjuk a klasszifikátort
        if (posts.length > 0) {
            this.classifier.train();
        }
    }

    async retrainClassifier() {
        await this.trainClassifierFromExistingPosts();
    }

    async analyzeContent(blogPost: BlogPost) {
        const content = this.prepareContent(blogPost);
        const tokens = this.tokenizer.tokenize(content);
        const cleanTokens = this.cleanTokens(tokens);

        // Dinamikus kategória javaslatok
        const categoryPredictions = await this.predictCategories(content);

        // Új kulcsszavak azonosítása
        const keywords = await this.identifyKeywords(cleanTokens);

        // Újdonság detektálás - mennyire egyedi a tartalom
        const uniquenessScore = await this.calculateUniqueness(content);

        return {
            suggestedCategories: categoryPredictions,
            keywords,
            uniquenessScore,
            sentiment: this.analyzeSentiment(cleanTokens),
            metrics: {
                wordCount: tokens.length,
                uniqueWords: new Set(cleanTokens).size,
                averageWordLength: this.calculateAverageWordLength(cleanTokens)
            }
        };
    }

    private async predictCategories(content: string): Promise<Array<{name: string, confidence: number}>> {
        if (this.classifier.docs.length === 0) {
            // Ha még nincs betanított modell, használjunk egyszerűbb módszert
            return this.fallbackCategorization(content);
        }

        const classifications = this.classifier.getClassifications(content);
        return classifications
            .map(c => ({
                name: c.label,
                confidence: Number((c.value * 100).toFixed(2))
            }))
            .filter(c => c.confidence > 20)
            .sort((a, b) => b.confidence - a.confidence);
    }

    private async fallbackCategorization(content: string): Promise<Array<{name: string, confidence: number}>> {
        // Kibővített kulcsszavak kategóriánként
        const basicKeywords = {
            'Technology': [
                'programming', 'software', 'computer', 'tech', 'code', 'development',
                'application', 'system', 'hardware', 'technology', 'digital', 'computing',
                'engineering', 'technical', 'processor', 'memory', 'database', 'platform',
                'architecture', 'infrastructure'
            ],
            'Lifestyle': [
                'life', 'health', 'wellness', 'fitness', 'food', 'travel', 'fashion',
                'lifestyle', 'hobby', 'diet', 'exercise', 'nutrition', 'cooking',
                'wellbeing', 'meditation', 'mindfulness', 'workout', 'recipe',
                'adventure', 'self-improvement'
            ],
            'Business': [
                'business', 'marketing', 'finance', 'startup', 'management', 'entrepreneur',
                'market', 'strategy', 'company', 'investment', 'revenue', 'profit',
                'sales', 'customer', 'client', 'product', 'service', 'ROI', 'growth',
                'enterprise', 'leadership', 'innovation', 'commerce', 'analytics'
            ],
            'Science': [
                'science', 'research', 'study', 'discovery', 'experiment', 'innovation',
                'laboratory', 'scientific', 'theory', 'analysis', 'hypothesis',
                'methodology', 'physics', 'chemistry', 'biology', 'mathematics',
                'quantum', 'molecular', 'academic', 'empirical'
            ],
            'AI & ML': [
                'ai', 'artificial intelligence', 'machine learning', 'neural', 'deep learning',
                'model', 'training', 'dataset', 'prediction', 'algorithm', 'tensorflow',
                'pytorch', 'nlp', 'computer vision', 'robotics', 'automation',
                'reinforcement learning', 'supervised', 'unsupervised', 'clustering',
                'classification', 'regression', 'neural network'
            ],
            'Web Development': [
                'frontend', 'backend', 'fullstack', 'javascript', 'html', 'css',
                'api', 'framework', 'web', 'responsive', 'react', 'angular', 'vue',
                'nodejs', 'php', 'mysql', 'mongodb', 'rest', 'graphql', 'http',
                'server', 'client', 'browser', 'dom', 'webpack', 'sass', 'less',
                'typescript', 'jquery', 'bootstrap'
            ],
            'Mobile Development': [
                'mobile', 'ios', 'android', 'app', 'react native', 'flutter',
                'swift', 'kotlin', 'mobile app', 'smartphone', 'tablet', 'native',
                'hybrid', 'xamarin', 'ionic', 'cordova', 'ui/ux', 'responsive design',
                'mobile-first', 'play store', 'app store', 'pwa'
            ],
            'Data Science': [
                'data', 'analytics', 'statistics', 'visualization', 'analysis',
                'database', 'sql', 'python', 'pandas', 'jupyter', 'numpy',
                'scipy', 'matplotlib', 'tableau', 'power bi', 'big data',
                'data mining', 'data warehouse', 'etl', 'reporting', 'dashboard',
                'business intelligence', 'machine learning'
            ],
            'DevOps': [
                'devops', 'deployment', 'ci/cd', 'docker', 'kubernetes', 'aws',
                'cloud', 'infrastructure', 'automation', 'pipeline', 'jenkins',
                'git', 'ansible', 'terraform', 'monitoring', 'logging', 'scaling',
                'microservices', 'containers', 'orchestration', 'configuration management',
                'continuous integration', 'continuous deployment'
            ],
            'Security': [
                'security', 'cybersecurity', 'encryption', 'hackers', 'authentication',
                'authorization', 'vulnerability', 'firewall', 'protection', 'threat',
                'penetration testing', 'malware', 'virus', 'ransomware', 'phishing',
                'cryptography', 'ssl', 'https', 'vpn', 'identity', 'access control',
                'compliance', 'audit', 'risk management'
            ]
        };

        const tokens = this.tokenizer.tokenize(content.toLowerCase());
        const cleanTokens = this.cleanTokens(tokens);
        const results = new Map<string, number>();

        // Minden kategóriához kiszámoljuk a megfelelési arányt
        for (const [category, keywords] of Object.entries(basicKeywords)) {
            let matches = 0;
            let totalPossibleMatches = Math.min(keywords.length, cleanTokens.length);

            for (const token of cleanTokens) {
                // Exact match keresése
                if (keywords.includes(token)) {
                    matches += 1;
                    continue;
                }

                // Részleges egyezés keresése (pl. "javascript" megtalálása "javascriptben" szóban)
                for (const keyword of keywords) {
                    if (token.includes(keyword) || keyword.includes(token)) {
                        matches += 0.5; // Részleges egyezésért fél pont
                        break;
                    }
                }
            }

            // Konfidencia számítás: találatok / lehetséges találatok
            const confidence = (matches / totalPossibleMatches) * 100;
            if (confidence > 0) {
                results.set(category, confidence);
            }
        }

        return Array.from(results.entries())
            .map(([name, confidence]) => ({
                name,
                confidence: Number(confidence.toFixed(2))
            }))
            .sort((a, b) => b.confidence - a.confidence)
            .filter(result => result.confidence > 5); // Csak 5% feletti találatokat adjuk vissza
    }

    private async identifyKeywords(tokens: string[]): Promise<Array<{word: string, relevance: number}>> {
        // Új TF-IDF példány csak ehhez a dokumentumhoz
        const documentTfidf = new natural.TfIdf();
        documentTfidf.addDocument(tokens);

        // Összehasonlítjuk a meglévő dokumentumokkal
        return documentTfidf
            .listTerms(0)
            .filter(term => term.tfidf > 5) // Csak a jelentős szavak
            .map(term => ({
                word: term.term,
                relevance: Number(term.tfidf.toFixed(2))
            }))
            .slice(0, 10);
    }

    private async calculateUniqueness(content: string): Promise<number> {
        // Összehasonlítjuk a meglévő tartalmakkal
        const similarity = await this.calculateContentSimilarity(content);
        return Number((1 - similarity).toFixed(2));
    }

    private async calculateContentSimilarity(content: string): Promise<number> {
        // Itt implementálhatunk különböző similarity metrikákat
        // Például: Jaccard similarity, Cosine similarity, stb.
        return 0.5; // Példa érték
    }

    private prepareContent(blogPost: BlogPost): string {
        return `${blogPost.title} ${blogPost.content}`.toLowerCase();
    }

    private cleanTokens(tokens: string[]): string[] {
        return tokens
            .map(token => token.toLowerCase())
            .filter(token => token.length > 2)
            .filter(token => !natural.stopwords.includes(token));
    }

    private analyzeSentiment(tokens: string[]) {
        const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
        const score = analyzer.getSentiment(tokens);
        
        return {
            score: Number(score.toFixed(2)),
            label: score > 0.3 ? 'positive' : score < -0.3 ? 'negative' : 'neutral'
        };
    }

    private calculateAverageWordLength(tokens: string[]): number {
        const totalLength = tokens.reduce((sum, token) => sum + token.length, 0);
        return Number((totalLength / tokens.length).toFixed(2));
    }
}