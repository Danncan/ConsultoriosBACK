import { ActivityModel } from "../models/ActivityModel.js";
import { AuditModel } from "../models/AuditModel.js";
import { InternalUserModel } from "../models/InternalUserModel.js";
import { getUserId } from '../sessionData.js';
import moment from "moment-timezone";

export class ActivityController {
    static async getActivities(req, res) {
        try {
            const activities = await ActivityModel.getAll();
            res.json(activities);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    static async getById(req, res) {
        const { id } = req.params;
        try {
            const activity = await ActivityModel.getById(id);
            if (activity) return res.json(activity);
            res.status(404).json({ message: "Activity not found" });
        } catch (error) {
            res.status(500).json(error);
        }
    }

    static async getAllByCodeCase(req, res) {
        const { codeCase } = req.params;
        try {
            const activity = await ActivityModel.getAllByCodeCase(codeCase);
            if (activity) return res.json(activity);
            res.status(404).json({ message: "Activities not found" });
        } catch (error) {
            res.status(500).json(error);
        }
    }
        
    static async getAllById(req, res) {
        const { internalId } = req.params;
        try {
            const activities = await ActivityModel.getAllById(internalId);
            if (activities && activities.length > 0) {
                return res.json(activities);
            }
            res.status(404).json({ message: "Activities not found" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getDocumentById(req, res) {
        const { id } = req.params;
        try {
            const documentResult = await ActivityModel.getDocumentById(id);
    
            if (!documentResult || !documentResult.Activity_Document) {
                return res.status(404).json({ message: "Document not found" });
            }
    
            // Establece los encabezados para indicar que es un PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline; filename=documento.pdf');
    
            // Envía el documento como respuesta binaria
            res.send(documentResult.Activity_Document);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async createActivity(req, res) {
        try {
            console.log("📥 Recibiendo solicitud para crear actividad...");
            const { Init_Code } = req.body;
    
            const internalId = req.headers["internal-id"]; // Obtener el Internal_ID desde los encabezados
    
            console.log("🔍 Internal_ID obtenido:", internalId);
            // Verificar que el Internal_ID exista en la tabla internal_users
            const internalUser = await InternalUserModel.getById(internalId);
            if (!internalUser) {
                console.error(`❌ El Internal_ID ${internalId} no existe en la tabla internal_users.`);
                return res.status(400).json({ error: `El Internal_ID ${internalId} no existe en la tabla internal_users` });
            }
    
            // Llamar al modelo y pasar `file` y `internalId`
            const newActivity = await ActivityModel.create({ ...req.body }, req.file, internalId); // Pass req.file
    
            console.log("📝 Registrando auditoría...");
    
            // Registrar en Audit
            //await AuditModel.registerAudit(internalId, "INSERT", "Activity", `El usuario interno ${internalId} creó la actividad con ID ${newActivity.Activity_Id}`);
    
            console.log("✅ Actividad creada con éxito.");
    
            res.status(201).json({ message: "Actividad creada con evidencia", data: newActivity });
        } catch (error) {
            console.error("❌ Error en la creación de actividad:", error.message);
            res.status(500).json({ error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const internalId = req.headers["internal-id"];

            // Check if the internal user exists
            const internalUser = await InternalUserModel.getById(internalId);
            if (!internalUser) {
                return res.status(400).json({ error: `El Internal_ID ${internalId} no existe en la tabla internal_users` });
            }

            // Prepare the data for the update
            const activityData = { ...req.body }; 

            // Check if a file was uploaded
            const file = req.file;

            // Update the activity and document (if a file was uploaded)
            const updatedActivity = await ActivityModel.update(id, activityData, file, internalId); 

            if (!updatedActivity) {
                return res.status(404).json({ message: "Activity not found" });
            }

            return res.json({ message: "Activity updated successfully", data: updatedActivity });
        } catch (error) {
            console.error("Error updating activity:", error);
            return res.status(500).json({ error: error.message });
        }
    }

    static async generateExcelReport(req, res) {
        try {
          const { startDate, endDate } = req.query;
          const userTimezone = "America/Guayaquil"; // Zona horaria específica
    
          // Validar fechas usando moment con formato estricto
          if (
            !startDate ||
            !endDate ||
            !moment(startDate, "YYYY-MM-DD", true).isValid() ||
            !moment(endDate, "YYYY-MM-DD", true).isValid()
          ) {
            return res
              .status(400)
              .json({ message: "Fechas de inicio y fin son requeridas en formato YYYY-MM-DD." });
          }
    
          // --- Corrección de zona horaria ---
          const queryStartDate = moment
            .tz(startDate, "YYYY-MM-DD", userTimezone)
            .startOf("day")
            .utc()
            .toDate();
          const queryEndDate = moment
            .tz(endDate, "YYYY-MM-DD", userTimezone)
            .endOf("day")
            .utc()
            .toDate();
    
          // Llamar al modelo para generar el buffer del Excel
          const excelBuffer = await ActivityModel.generateExcelReportForActivities(
            queryStartDate,
            queryEndDate
          );
    
          // Configurar headers para la descarga del archivo Excel
          res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="Reporte_Actividades_${startDate}_a_${endDate}.xlsx"`
          );
          res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    
          // Enviar el buffer del archivo Excel
          res.send(excelBuffer);
        } catch (error) {
          console.error("Error generando el reporte Excel:", error);
          // Asegurar que la respuesta de error sea siempre JSON
          if (!res.headersSent) {
            res
              .status(500)
              .json({ message: "Error interno al generar el reporte Excel.", error: error.message });
          }
        }
      }
}