import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Crear la firma contable principal
  const firm = await prisma.firm.create({
    data: {
      name: "Vázquez & Asociados · Firma Contable",
      mode: "SOLOPRENEUR",
      brandColor: "#B8935F",
      whatsappPhone: "525512345678",
    },
  });

  // Crear el usuario titular (Contador Público Certificado)
  const accountant = await prisma.user.create({
    data: {
      firmId: firm.id,
      name: "Mtro. Alejandro Vázquez, CPC",
      email: "contador@vazquezcontadores.mx",
      passwordHash: "$2a$10$wN31V10E.z.lGz8V9.eYbeZ88P1tWqXG.OcvQoFjMce2W3d1kMfa.", // demo hash
      role: "ACCOUNTANT",
      title: "Socio Director Fiscal",
      specialty: "Defensa Fiscal, RESICO y PyMEs",
      bio: "Contador Público Certificado con 14 años de experiencia en litigio y consultoría tributaria.",
      isPubliclyListed: true,
    },
  });

  // Crear clientes de ejemplo
  const client1 = await prisma.client.create({
    data: {
      firmId: firm.id,
      accountantId: accountant.id,
      fullName: "InnovaTech Software S.A. de C.V.",
      email: "finanzas@innovatech.mx",
      phone: "+52 55 9182 3000",
      taxId: "ITS210408KT9",
      clientType: "BUSINESS",
      status: "ACTIVE",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      firmId: firm.id,
      accountantId: accountant.id,
      fullName: "Ing. Sofía Carranza Valdés",
      email: "sofia.carranza@devstudio.com",
      phone: "+52 55 4120 8890",
      taxId: "CAVS920311N78",
      clientType: "FREELANCER",
      status: "ACTIVE",
    },
  });

  // Crear noticias legales
  await prisma.newsItem.createMany({
    data: [
      {
        firmId: firm.id,
        sourceName: "SAT · Resolución Miscelánea Fiscal",
        sourceUrl: "https://www.sat.gob.mx/normatividad",
        rawSummary: "Nuevas reglas de permanencia para RESICO en el ejercicio fiscal 2026.",
        editedSummary: "Se otorga periodo de gracia para no ser expulsado del régimen por omisión de declaraciones.",
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      {
        firmId: firm.id,
        sourceName: "Diario Oficial de la Federación (DOF)",
        sourceUrl: "https://www.dof.gob.mx/",
        rawSummary: "Decreto de estímulos para deducción acelerada en inversiones de IA y tecnología.",
        editedSummary: "Permite deducir hasta el 50% de activos fijos computacionales en el primer año.",
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    ],
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
