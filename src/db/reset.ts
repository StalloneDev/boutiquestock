import { db } from "./index";
import { 
  productsTable, 
  categoriesTable, 
  salesTable, 
  stockMovementsTable, 
  productVariantsTable, 
  purchaseOrdersTable, 
  purchaseOrderItemsTable, 
  cashRegisterSessionsTable, 
  usersTable, 
  discountLogsTable 
} from "./schema";
import { expensesTable } from "./schema/expenses";
import { sql } from "drizzle-orm";

async function main() {
  console.log("⚠️ Vidage de la base de données en cours...");

  try {
    await db.transaction(async (tx) => {
      // Désactiver les contraintes de clés étrangères (Postgres)
      await tx.execute(sql`SET CONSTRAINTS ALL DEFERRED`);
      
      // Tronquer toutes les tables
      // L'ordre importe peu avec TRUNCATE CASCADE, mais ici on le fait explicitement
      await tx.execute(sql`TRUNCATE TABLE ${salesTable} CASCADE`);
      await tx.execute(sql`TRUNCATE TABLE ${stockMovementsTable} CASCADE`);
      await tx.execute(sql`TRUNCATE TABLE ${purchaseOrderItemsTable} CASCADE`);
      await tx.execute(sql`TRUNCATE TABLE ${purchaseOrdersTable} CASCADE`);
      await tx.execute(sql`TRUNCATE TABLE ${productVariantsTable} CASCADE`);
      await tx.execute(sql`TRUNCATE TABLE ${productsTable} CASCADE`);
      await tx.execute(sql`TRUNCATE TABLE ${categoriesTable} CASCADE`);
      await tx.execute(sql`TRUNCATE TABLE ${expensesTable} CASCADE`);
      await tx.execute(sql`TRUNCATE TABLE ${discountLogsTable} CASCADE`);
      await tx.execute(sql`TRUNCATE TABLE ${cashRegisterSessionsTable} CASCADE`);
    });

    console.log("✅ Base de données vidée avec succès !");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors du vuidage :", error);
    process.exit(1);
  }
}

main();
