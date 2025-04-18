import { sequelize } from "../database/database.js";
import { InitialConsultations } from "../schemas/Initial_Consultations.js";
import { User } from "../schemas/User.js";
import { InternalUser } from "../schemas/Internal_User.js";
import { AuditModel } from "../models/AuditModel.js";
import { UserModel } from "../models/UserModel.js";
import { Evidence } from "../schemas/Evidences.js";
import { getUserId } from "../sessionData.js";
import { PDFDocument } from "pdf-lib";
import { SocialWork } from "../schemas/SocialWork.js"; // Asegúrate de que la ruta sea correcta
import { Op } from "sequelize";
import moment from "moment";
import fontkit from "@pdf-lib/fontkit"; // Importa fontkit correctamente
import fs from "fs";

function buildInitAlertNote({
  prefix = "",
  User_AcademicInstruction,
  User_Profession,
  User_IncomeLevel,
  User_FamilyIncome,
  prefix2 = "",
  Init_Subject,
  prefix3 = "",
  User_City,
}) {
  const messages = [];

  // Validaciones socioeconómicas
  const socioEconomicMessages = [];
  if (
    ["Superior", "Postgrado", "Doctorado"].includes(User_AcademicInstruction)
  ) {
    socioEconomicMessages.push(
      `<br>El usuario tiene una instrucción: ${User_AcademicInstruction}.`
    );
  }
  if (["Empleado Privado", "Patrono", "Socio"].includes(User_Profession)) {
    socioEconomicMessages.push(
      `<br>El usuario tiene una profesión: ${User_Profession}.`
    );
  }
  if (["3 SBU", "4 SBU", "5 SBU", ">5 SBU"].includes(User_IncomeLevel)) {
    socioEconomicMessages.push(
      `<br>El usuario tiene un nivel de ingresos: ${User_IncomeLevel}.`
    );
  }
  if (["3 SBU", "4 SBU", "5 SBU", ">5 SBU"].includes(User_FamilyIncome)) {
    socioEconomicMessages.push(
      `<br>El usuario tiene un ingreso familiar: ${User_FamilyIncome}.`
    );
  }
  if (socioEconomicMessages.length > 0) {
    messages.push(
      `<strong>${prefix}</strong>${socioEconomicMessages.join(" ")}`
    );
  }

  // Validación de materia
  if (["Tierras", "Administrativo", "Constitucional"].includes(Init_Subject)) {
    messages.push(
      `<br><strong>${prefix2}</strong><br>El usuario busca atención en la materia de: ${Init_Subject}.`
    );
  }

  // Validación de ciudad
  if (!["Quito"].includes(User_City)) {
    messages.push(
      `<br><strong>${prefix3}</strong><br>El usuario reside en: ${User_City}`
    );
  }

  return messages.length > 0 ? messages.join("<br>") : null;
}

export class InitialConsultationsModel {
  static async getAll() {
    try {
      return await InitialConsultations.findAll({
        attributes: {
          exclude: ["Init_AttentionSheet"],
        },
      });
    } catch (error) {
      throw new Error(
        `Error retrieving initial consultations: ${error.message}`
      );
    }
  }

  static async getById(id) {
    try {
      return await InitialConsultations.findOne({
        where: { Init_Code: id },
        attributes: {
          exclude: ["Init_AttentionSheet"],
        },
      });
    } catch (error) {
      throw new Error(
        `Error retrieving initial consultation: ${error.message}`
      );
    }
  }

  static async findById(id) {
    try {
      return await InitialConsultations.findOne({
        where: { Init_Code: id },
        include: [
          {
            model: User,
            attributes: [
              "User_ID",
              "User_FirstName",
              "User_LastName",
              "User_Age",
              "User_Phone",
            ],
          },
        ],
      });
    } catch (error) {
      throw new Error(`Error retrieving consultation: ${error.message}`);
    }
  }

  static async getByUserId(userId) {
    try {
      return await InitialConsultations.findAll({
        where: { User_ID: userId },
      });
    } catch (error) {
      throw new Error(`Error fetching consultations: ${error.message}`);
    }
  }

  static async getByInitTypeAndSubjectCases(initType, initSubject, initStatus) {
    try {
      return await InitialConsultations.findAll({
        where: {
          Init_Type: initType,
          Init_Subject: initSubject,
          Init_Status: initStatus,
        },
      });
    } catch (error) {
      throw new Error(`Error fetching consultations: ${error.message}`);
    }
  }

  static async getByInitTypeAndSubjectAndStatus(
    initType,
    initSubject,
    initStatus
  ) {
    try {
      return await InitialConsultations.findAll({
        where: {
          Init_Type: initType,
          Init_Subject: initSubject,
          Init_Status: initStatus,
        },
      });
    } catch (error) {
      throw new Error(`Error fetching consultations: ${error.message}`);
    }
  }

  static async getByTypeAndStatus(initType, initStatus) {
    try {
      return await InitialConsultations.findAll({
        where: {
          Init_Type: initType,
          Init_Status: initStatus,
        },
      });
    } catch (error) {
      throw new Error(`Error fetching consultations: ${error.message}`);
    }
  }

  static async createInitialConsultation(data, files, internalUser) {
    const userId = internalUser || getUserId();

    const t = await sequelize.transaction();
    let userCreated = false;

    try {
      const evidenceFile = files?.evidenceFile || null;
      const healthDocument = files?.healthDocuments || null;

      // Verificar si el usuario externo existe, si no, crearlo
      let user = await User.findOne({
        where: { User_ID: data.User_ID },
        transaction: t,
      });
      if (!user) {
        user = await UserModel.create(
          {
            User_ID: data.User_ID,
            User_ID_Type: data.User_ID_Type,
            User_Age: data.User_Age,
            User_FirstName: data.User_FirstName,
            User_LastName: data.User_LastName,
            User_Gender: data.User_Gender,
            User_BirthDate: data.User_BirthDate,
            User_Nationality: data.User_Nationality,
            User_Ethnicity: data.User_Ethnicity,
            User_Province: data.User_Province,
            User_City: data.User_City,
            User_Phone: data.User_Phone,
            User_Email: data.User_Email,
            User_Address: data.User_Address,
            User_Sector: data.User_Sector,
            User_Zone: data.User_Zone,
            User_ReferenceRelationship: data.User_ReferenceRelationship,
            User_ReferenceName: data.User_ReferenceName,
            User_ReferencePhone: data.User_ReferencePhone,

            User_SocialBenefit: data.User_SocialBenefit,
            User_EconomicDependence: data.User_EconomicDependence,
            User_AcademicInstruction: data.User_AcademicInstruction,
            User_Profession: data.User_Profession,
            User_MaritalStatus: data.User_MaritalStatus,
            User_Dependents: data.User_Dependents,
            User_IncomeLevel: data.User_IncomeLevel,
            User_FamilyIncome: data.User_FamilyIncome,
            User_FamilyGroup: data.User_FamilyGroup,
            User_EconomicActivePeople: data.User_EconomicActivePeople,

            User_OwnAssets: data.User_OwnAssets,
            User_HousingType: data.User_HousingType,
            User_Pensioner: data.User_Pensioner,
            User_HealthInsurance: data.User_HealthInsurance,
            User_VulnerableSituation: data.User_VulnerableSituation,
            User_SupportingDocuments: data.User_SupportingDocuments,
            User_Disability: data.User_Disability,
            User_DisabilityPercentage: data.User_DisabilityPercentage,
            User_CatastrophicIllness: data.User_CatastrophicIllness,
            User_HealthDocuments: healthDocument ? healthDocument.buffer : null,
            User_HealthDocumentsName: data.User_HealthDocumentsName,
          },
          { transaction: t }
        );
        console.log(
          "Buffer de documento de salud:",
          healthDocument
            ? healthDocument.buffer
            : "No hay archivo de documento de salud"
        );

        userCreated = true; // Marcar que el usuario fue creado en esta transacción

        // 🔹 Registrar en Audit que un usuario interno creó este usuario externo
        await AuditModel.registerAudit(
          userId,
          "INSERT",
          "User",
          `El usuario interno ${userId} creó al usuario externo ${data.User_ID}`
        );
      }

      // Verificar si el usuario interno existe
      const internalUser = await InternalUser.findOne({
        where: { Internal_ID: userId },
        transaction: t,
      });
      if (!internalUser) {
        throw new Error(`El usuario interno con ID ${userId} no existe.`);
      }

      //CREACION DE CÓDIGO DE CONSULTA INICIAL
      // Obtener el último Init_Code ordenado descendentemente
      const lastRecord = await InitialConsultations.findOne({
        order: [["Init_Code", "DESC"]],
        transaction: t,
      });

      let lastNumber = 0;
      if (lastRecord && lastRecord.Init_Code) {
        const lastCode = lastRecord.Init_Code;
        const numberPart = lastCode.substring(3); // Extraer número después de "AT-"
        lastNumber = parseInt(numberPart, 10);
      }

      const newNumber = lastNumber + 1;
      const newCode = `AT-${String(newNumber).padStart(6, "0")}`;

      // Crear la consulta inicial
      const newConsultation = await InitialConsultations.create(
        {
          Init_Code: newCode,
          Internal_ID: userId,
          User_ID: data.User_ID,
          Init_ClientType: data.Init_ClientType,
          Init_Date: data.Init_Date,
          Init_EndDate: data.Init_EndDate,
          Init_Subject: data.Init_Subject,
          Init_Lawyer: data.Init_Lawyer,
          Init_Notes: data.Init_Notes,
          Init_Office: data.Init_Office,
          Init_Topic: data.Init_Topic,
          Init_Service: data.Init_Service,
          Init_Referral: data.Init_Referral,
          Init_Complexity: data.Init_Complexity,
          Init_Status: data.Init_Status,
          Init_CaseStatus: data.Init_CaseStatus,
          Init_SocialWork: data.Init_SocialWork,
          Init_MandatorySW: data.Init_MandatorySW,
          Init_Type: data.Init_Type,
          Init_AlertNote: buildInitAlertNote({
            prefix: "No cumple perfil socio económico:",
            User_AcademicInstruction: data.User_AcademicInstruction,
            User_Profession: data.User_Profession,
            User_IncomeLevel: data.User_IncomeLevel,
            User_FamilyIncome: data.User_FamilyIncome,
            prefix2: "Solicita materia no atendida por el CJG:",
            Init_Subject: data.Init_Subject,
            prefix3: "Recide fuera del DMQ (Distrito Metropolitano de Quito):",
            User_City: data.User_City,
          }),
        },
        { transaction: t }
      );

      console.log("🔹 Nuevo Init_Code generado:", newConsultation.Init_Code); // ✅ Verificar que tiene valor

      // Validar que Init_Code no sea null antes de continuar
      if (!newConsultation.Init_Code) {
        throw new Error("No se pudo generar Init_Code para la consulta.");
      }

      // 🔹 Registrar en Audit que un usuario interno creó una consulta inicial
      await AuditModel.registerAudit(
        userId,
        "INSERT",
        "Initial_Consultations",
        `El usuario interno ${userId} creó la consulta inicial ${data.Init_Code} para el usuario ${data.User_ID}`
      );

      // 🔹 Crear la evidencia asociada
      const newEvidence = await Evidence.create(
        {
          Internal_ID: userId,
          Init_Code: newConsultation.Init_Code,
          Evidence_Name: evidenceFile
            ? evidenceFile.originalname
            : "Sin Documento",
          Evidence_Document_Type: evidenceFile ? evidenceFile.mimetype : null,
          Evidence_URL: null,
          Evidence_Date: new Date(),
          Evidence_File: evidenceFile ? evidenceFile.buffer : null, // Archivo de evidencia
        },
        { transaction: t }
      );
      console.log(
        "Buffer de evidencia:",
        evidenceFile ? evidenceFile.buffer : "No hay archivo de evidencia"
      );

      // 🔹 Registrar en Audit la creación de la evidencia
      await AuditModel.registerAudit(
        userId,
        "INSERT",
        "Evidences",
        `El usuario interno ${userId} subió la evidencia ${newEvidence.Evidence_ID} para la consulta ${data.Init_Code}`
      );

// --- Lógica para crear el registro en SocialWork si corresponde ---
if (newConsultation.Init_SocialWork === true) {
    // Verificar si ya existe un registro en SocialWork para esta consulta
    const existingSocialWork = await SocialWork.findOne({
        where: { Init_Code: newConsultation.Init_Code },
        transaction: t
    });
    if (!existingSocialWork) {
        const currentDate = moment().format("YYYY-MM-DD");
        const todayStart = moment(currentDate).startOf("day").toDate();
        const todayEnd = moment(currentDate).endOf("day").toDate();
        // Contar los registros de hoy usando SW_EntryDate
        const countResult = await SocialWork.findAndCountAll({
            where: {
                SW_EntryDate: {
                    [Op.gte]: todayStart,
                    [Op.lte]: todayEnd,
                },
            },
            transaction: t,
            paranoid: false,
        });
        const count = countResult.count + 1;
        const swProcessNumber = `TS${currentDate.replace(/-/g, "")}-${String(count).padStart(5, "0")}`;
        await SocialWork.create(
            {
                SW_ProcessNumber: swProcessNumber,
                SW_EntryDate: new Date(),
                SW_Status: "Activo",
                Init_Code: newConsultation.Init_Code,
            },
            { transaction: t }
        );
        console.log(
            `✅ Se insertó un registro en SocialWork con SW_ProcessNumber: ${swProcessNumber} porque Init_SocialWork es true.`
        );
        await AuditModel.registerAudit(
            userId,
            "INSERT",
            "SocialWork",
            `El usuario interno ${userId} creó el registro de trabajo social ${swProcessNumber} para la consulta ${newConsultation.Init_Code}`,
            { transaction: t }
        );
    } else {
        console.log(`ℹ️ Ya existe un registro en SocialWork para la consulta ${newConsultation.Init_Code}. No se creó uno nuevo.`);
    }
}
// --- Fin de la lógica de SocialWork ---



      await t.commit();
      return {
        message: "Consulta inicial ",
        consultation: newConsultation,
        evidence: newEvidence,
      };
    } catch (error) {
      await t.rollback(); // Revertir la transacción en caso de error

      if (userCreated) {
        // Eliminar el usuario creado si se genera un error
        await User.destroy({ where: { User_ID: data.User_ID } });

        // 🔹 Registrar en Audit que se eliminó el usuario por error en la transacción
        await AuditModel.registerAudit(
          userId,
          "DELETE",
          "User",
          `El usuario interno ${userId} eliminó al usuario externo ${data.User_ID} debido a un error en la creación de la consulta inicial`
        );
      }

      throw new Error(`Error al crear la consulta inicial: ${error.message}`);
    }
  }

  static async createNewConsultation(data, internalUser) {
    const internalId = internalUser || getUserId(); // Obtener el ID del usuario interno desde la sesión o el argumento
    const t = await sequelize.transaction();
    try {
      let user = await User.findOne({
        where: { User_ID: data.User_ID },
        transaction: t,
      });
      if (!user) {
        throw new Error(`El usuario externo con ID ${data.User_ID} no existe.`);
      }

      // Verificar si el usuario interno existe
      const internalUser = await InternalUser.findOne({
        where: { Internal_ID: internalId },
        transaction: t,
      });
      if (!internalUser) {
        throw new Error(`El usuario interno con ID ${internalId} no existe.`);
      }

      // Obtener el último Init_Code ordenado descendentemente
      const lastRecord = await InitialConsultations.findOne({
        order: [["Init_Code", "DESC"]],
        transaction: t,
      });

      let lastNumber = 0;
      if (lastRecord && lastRecord.Init_Code) {
        const lastCode = lastRecord.Init_Code;
        const numberPart = lastCode.substring(3); // Extraer número después de "AT-"
        lastNumber = parseInt(numberPart, 10);
      }

      const newNumber = lastNumber + 1;
      const newCode = `AT-${String(newNumber).padStart(6, "0")}`;

      const newConsultation = await InitialConsultations.create(
        {
          Init_Code: newCode,
          Internal_ID: internalId,
          User_ID: data.User_ID,
          Init_ClientType: data.Init_ClientType,
          Init_Date: data.Init_Date,
          Init_EndDate: data.Init_EndDate,
          Init_Subject: data.Init_Subject,
          Init_Lawyer: data.Init_Lawyer,
          Init_Notes: data.Init_Notes,
          Init_Office: data.Init_Office,
          Init_Topic: data.Init_Topic,
          Init_Service: data.Init_Service,
          Init_Referral: data.Init_Referral,
          Init_Complexity: data.Init_Complexity,
          Init_Status: data.Init_Status,
          Init_CaseStatus: data.Init_CaseStatus,
          Init_SocialWork: data.Init_SocialWork,
          Init_MandatorySW: data.Init_MandatorySW,
          Init_Type: data.Init_Type,
          Init_AlertNote: buildInitAlertNote({
            prefix: "No cumple perfil socio económico:",
            User_AcademicInstruction: user.User_AcademicInstruction,
            User_Profession: user.User_Profession,
            User_IncomeLevel: user.User_IncomeLevel,
            User_FamilyIncome: user.User_FamilyIncome,
            prefix2: "Solicita materia no atendida por el CJG:",
            Init_Subject: data.Init_Subject,
            prefix3: "Recide fuera del DMQ (Distrito Metropolitano de Quito):",
            User_City: user.User_City,
          }),
        },
        { transaction: t }
      );

      // 🔹 Registrar en Audit que un usuario interno creó una consulta inicial
      await AuditModel.registerAudit(
        internalId,
        "INSERT",
        "Initial_Consultations",
        `El usuario interno ${internalId} creó una nueva consulta inicial ${newConsultation.Init_Code} para el usuario ${data.User_ID}`,
        { transaction: t }
      );

      // --- Lógica para crear el registro en SocialWork si corresponde ---
      if (newConsultation.Init_SocialWork === true) {
        // Verificar si ya existe un registro en SocialWork para esta consulta
        const existingSocialWork = await SocialWork.findOne({
          where: { Init_Code: newConsultation.Init_Code },
          transaction: t,
        });

        if (!existingSocialWork) {
          const currentDate = moment().format("YYYY-MM-DD");
          const todayStart = moment(currentDate).startOf("day").toDate();
          const todayEnd = moment(currentDate).endOf("day").toDate();

          // Contar los registros de hoy usando la columna SW_EntryDate
          const countResult = await SocialWork.findAndCountAll({
            where: {
              SW_EntryDate: {
                [Op.gte]: todayStart,
                [Op.lte]: todayEnd,
              },
            },
            transaction: t,
            paranoid: false,
          });
          const count = countResult.count + 1;

          const swProcessNumber = `TS${currentDate.replace(/-/g, "")}-${String(
            count
          ).padStart(5, "0")}`;

          await SocialWork.create(
            {
              SW_ProcessNumber: swProcessNumber,
              SW_EntryDate: new Date(),
              SW_Status: "Activo",
              Init_Code: newConsultation.Init_Code,
            },
            { transaction: t }
          );

          console.log(
            `✅ Se insertó un registro en SocialWork con SW_ProcessNumber: ${swProcessNumber} porque Init_SocialWork es true.`
          );
          await AuditModel.registerAudit(
            internalId,
            "INSERT",
            "SocialWork",
            `El usuario interno ${internalId} creó el registro de trabajo social ${swProcessNumber} para la consulta ${newConsultation.Init_Code}`,
            { transaction: t }
          );
        } else {
          console.log(
            `ℹ️ Ya existe un registro en SocialWork para la consulta ${newConsultation.Init_Code}. No se creó uno nuevo.`
          );
        }
      }
      // --- Fin de la lógica de SocialWork ---

      await t.commit();

      return newConsultation;
    } catch (error) {
      throw new Error(
        `Error creating new initial consultation: ${error.message}`
      );
    }
  }

  static async update(id, data, internalUser) {
    const t = await sequelize.transaction();
    try {
      const consultation = await InitialConsultations.findOne({
        where: { Init_Code: id },
        transaction: t,
      });

      if (!consultation) {
        await t.rollback();
        return null;
      }

      const originalSocialWorkStatus = consultation.Init_SocialWork;
      const internalId = internalUser || getUserId();

      const [rowsUpdated] = await InitialConsultations.update(data, {
        where: { Init_Code: id },
        transaction: t,
      });

      if (rowsUpdated === 0) {
        await t.rollback();
        console.log(
          `No se actualizaron filas para la consulta ${id}. Los datos podrían ser los mismos.`
        );
        return consultation;
      }

      await AuditModel.registerAudit(
        internalId,
        "UPDATE",
        "Initial_Consultations",
        `El usuario interno ${internalId} actualizó la consulta inicial ${id}`,
        { transaction: t }
      );

      if (data.Init_SocialWork === true && !originalSocialWorkStatus) {
        const existingSocialWork = await SocialWork.findOne({
          where: { Init_Code: id },
          transaction: t,
        });

        if (!existingSocialWork) {
          const currentDate = moment().format("YYYY-MM-DD");
          const todayStart = moment(currentDate).startOf("day").toDate();
          const todayEnd = moment(currentDate).endOf("day").toDate();

          // --- Cambio aquí: Usar SW_EntryDate para contar ---
          const countResult = await SocialWork.findAndCountAll({
            where: {
              SW_EntryDate: {
                // <--- Usar SW_EntryDate
                [Op.gte]: todayStart,
                [Op.lte]: todayEnd,
              },
            },
            transaction: t,
            paranoid: false,
          });
          const count = countResult.count + 1;

          const swProcessNumber = `TS${currentDate.replace(/-/g, "")}-${String(
            count
          ).padStart(5, "0")}`;

          // --- Cambio aquí: Añadir SW_EntryDate al crear ---
          await SocialWork.create(
            {
              SW_ProcessNumber: swProcessNumber,
              SW_EntryDate: new Date(),
              SW_Status: "Activo",
              Init_Code: id,
            },
            { transaction: t }
          );

          console.log(
            `✅ Se insertó un registro en SocialWork con SW_ProcessNumber: ${swProcessNumber} porque Init_SocialWork cambió a true.`
          );
          await AuditModel.registerAudit(
            internalId,
            "INSERT",
            "SocialWork",
            `El usuario interno ${internalId} creó el registro de trabajo social ${swProcessNumber} para la consulta ${id}`,
            { transaction: t }
          );
        } else {
          console.log(
            `ℹ️ Ya existe un registro en SocialWork para la consulta ${id}. No se creó uno nuevo.`
          );
        }
      }

      await t.commit();
      const finalConsultation = await this.getById(id);
      return finalConsultation;
    } catch (error) {
      await t.rollback();
      console.error("Error en update InitialConsultationsModel:", error);
      throw new Error(`Error updating initial consultation: ${error.message}`);
    }
  }

  static async delete(id, internalUser) {
    try {
      const consultation = await this.getById(id);
      if (!consultation) return null;

      const internalId = internalUser || getUserId();
      await InitialConsultations.destroy({ where: { Init_Code: id } });

      // 🔹 Registrar en Audit que un usuario interno eliminó una consulta inicial
      await AuditModel.registerAudit(
        internalId,
        "DELETE",
        "Initial_Consultations",
        `El usuario interno ${internalId} eliminó la consulta inicial ${id}`
      );

      return consultation;
    } catch (error) {
      throw new Error(`Error deleting initial consultation: ${error.message}`);
    }
  }

  static async generateAttentionSheetBuffer(data) {
    try {
      // Traemos los datos del usuario de forma asíncrona
      const userData = await User.findOne({
        where: { User_ID: data.User_ID },
        attributes: [
          "User_FirstName",
          "User_LastName",
          "User_Age",
          "User_Phone",
        ],
      });

      if (!userData) {
        throw new Error("No se encontraron datos del usuario.");
      }

      console.log("Datos del usuario:", userData);

      // Limpiar etiquetas HTML del campo Init_Notes
      const cleanNotes = data.Init_Notes.replace(/&nbsp;/g, " ")
        .replace(/<\/?[^>]+(>|$)/g, "")
        .trim();

      // Cargar la plantilla PDF
      const templatePath = "./src/docs/FICHA DE ATENCION.pdf"; // Asegúrate de que la ruta sea correcta
      const templateBytes = fs.readFileSync(templatePath);

      // Crear un nuevo documento PDF basado en la plantilla
      const pdfDoc = await PDFDocument.load(templateBytes);

      // Registrar fontkit antes de usarlo
      pdfDoc.registerFontkit(fontkit);

      // Cargar la fuente Aptos
      const AptosBytes = fs.readFileSync("./src/docs/Aptos.ttf"); // Asegúrate de que la ruta sea correcta
      const AptosFont = await pdfDoc.embedFont(AptosBytes);

      // Obtener la primera página del PDF
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const fontSize = 11; // Tamaño de fuente para los textos

      // Rellenar los campos con los datos proporcionados
      firstPage.drawText(`${data.User_ID}`, {
        x: 113,
        y: 655,
        size: fontSize,
        font: AptosFont,
      });

      firstPage.drawText(
        `${userData.User_FirstName} ${userData.User_LastName}`,
        {
          x: 123,
          y: 632,
          size: fontSize,
          font: AptosFont,
        }
      );

      firstPage.drawText(
        `${
          data.Init_Date ? new Date(data.Init_Date).toLocaleDateString() : ""
        }`,
        {
          x: 397,
          y: 655,
          size: fontSize,
          font: AptosFont,
        }
      );

      firstPage.drawText(`${userData.User_Age}`, {
        x: 391,
        y: 632,
        size: fontSize,
        font: AptosFont,
      });

      firstPage.drawText(`${userData.User_Phone}`, {
        x: 120,
        y: 608,
        size: fontSize,
        font: AptosFont,
      });

      firstPage.drawText(`${data.Init_Subject}`, {
        x: 116,
        y: 584.5,
        size: fontSize,
        font: AptosFont,
      });

      firstPage.drawText(`${data.Init_Service}`, {
        x: 448,
        y: 608,
        size: fontSize,
        font: AptosFont,
      });

      firstPage.drawText(cleanNotes, {
        x: 76,
        y: 536,
        size: 10,
        font: AptosFont,
        maxWidth: 500,
        lineHeight: 14,
      });

      firstPage.drawText(
        `${userData.User_FirstName} ${userData.User_LastName}`,
        {
          x: 92,
          y: 194.5,
          size: 10,
          font: AptosFont,
        }
      );
      firstPage.drawText(`${data.User_ID}`, {
        x: 284,
        y: 194.5,
        size: 10,
        font: AptosFont,
      });

      // Generar el PDF modificado
      const pdfBytes = await pdfDoc.save();

      // Retornar el buffer del PDF generado
      return Buffer.from(pdfBytes);
    } catch (error) {
      console.error("Error generando el buffer del PDF:", error);
      throw error;
    }
  }
}
