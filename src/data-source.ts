import { DataSource } from "typeorm"

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "Asdasd007@",
    database: "nestjs_db",
    entities: ["src/modules/**/entities/*.ts"],
    migrations: ["src/migrations/*.ts"]
})