import { Op } from 'sequelize'; // Agregar esta línea
import ExcelJS from 'exceljs';
import moment from 'moment-timezone';
import { AuditModel } from "../models/AuditModel.js";
import { Activity } from "../schemas/Activity.js";
import { sequelize } from "../database/database.js";
import { getUserId } from '../sessionData.js'; // Adjust the import path as necessary
import { InitialConsultations } from "../schemas/Initial_Consultations.js";
import { Assignment } from "../schemas/Assignment.js"; 
import { User } from '../schemas/User.js';

export class ActivityModel {

    static async validateInitCode(initCode) {
        return await InitialConsultations.findOne({ where: { Init_Code: initCode } });
    }

    static async getAll() {
        try {
            return await Activity.findAll({
                attributes: {
                    exclude: ["Activity_Document"], // Exclude the BLOB field from the result
                },
                order: [['Activity_Start_Date', 'DESC']], // Order by Activity_Start_Date in descending order
            });
        } catch (error) {
            throw new Error(`Error retrieving activities: ${error.message}`);
        }
    }

    static async getById(id) {
        try {
            return await Activity.findOne({
                where: { Activity_Id: id }
            });
        } catch (error) {
            throw new Error(`Error retrieving activity: ${error.message}`);
        }
    }

    static async getAllByCodeCase(codeCase) {
        try {
            const activities = await Activity.findAll({
                where: { Init_Code: codeCase },
                include: [
                    {
                        model: InitialConsultations,
                        as: 'Initial_Consultation', 
                        attributes: ['Init_Code'],
                        required: true,
                        include: [
                            {
                                model: Assignment,
                                as: 'Assignments',
                                attributes: ['Internal_User_ID_Student'],
                                required: false
                            }
                        ]
                    }
                ],
                attributes: {
                    exclude: ["Activity_Document"],
                },
                order: [['Activity_Date', 'DESC']],
                // raw: false, // Ensure raw is not true
            });

            // Process results
            return activities.map((activity, index) => {
                const plainActivity = activity.toJSON();
                // Access using the correct association aliases
                const consultation = plainActivity.Initial_Consultation; // <--- Use expected alias
                const assignments = consultation?.Assignments;          // <--- Use expected nested alias
                const firstAssignment = assignments?.[0];
                const studentId = firstAssignment?.Internal_User_ID_Student;

                // Remove the nested structure using the correct alias
                delete plainActivity.Initial_Consultation; 

                // Add the student ID directly
                plainActivity.Internal_User_ID_Student = studentId || null;

                return plainActivity;
            });

        } catch (error) {
            console.error(`Error retrieving activities by code case (${codeCase}): ${error.message}`);
            // Log the full error for more details if needed
            console.error(error);
            throw new Error(`Error retrieving activities by code case: ${error.message}`);
        }
    }

    static async getAllById(internalId) {
        try {
            return await Activity.findAll({
                where: { 
                    Internal_ID: internalId,
                    // Filtrar solo actividades internas
                    [Op.and]: [
                        { Activity_IsInternal: 1 },
                        { Activity_StatusMobile: { [Op.ne]: 'finalizado' } }
                    ]
                }
            });
        } catch (error) {
            throw new Error(`Error retrieving activities by Internal_ID: ${error.message}`);
        }
    }
    

    static async getDocumentById(id) {
        try {
            return await Activity.findOne({
                attributes: ['Activity_Document'],
                where: { Activity_ID: id }
            });
        } catch (error) {
            throw new Error(`Error retrieving document: ${error.message}`);
        }
    }

    static async create(data, file, internalUser) {
        const t = await sequelize.transaction();
        try {
            const internalId = internalUser || getUserId();
            console.log("📥 Creando actividad con Internal_ID:", internalId);
    
            // Crear la actividad en la base de datos
            const newActivity = await Activity.create({
                Init_Code: data.Init_Code,
                Internal_ID: internalId, // Usar el Internal_ID proporcionado o derivado
                Activity_Type: data.Activity_Type,
                Activity_Description: data.Activity_Description,
                Activity_Location: data.Activity_Location,
                Activity_Date: data.Activity_Date,
                Activity_StartTime: data.Activity_StartTime,
                activityScheduledTime: data.activityScheduledTime,
                Activity_Status: data.Activity_Status,
                Activity_JurisdictionType: data.Activity_JurisdictionType,
                Activity_InternalReference: data.Activity_InternalReference,
                Activity_CourtNumber: data.Activity_CourtNumber,
                Activity_lastCJGActivity: data.Activity_lastCJGActivity,
                Activity_lastCJGActivityDate: data.Activity_lastCJGActivityDate,
                Activity_Observation: data.Activity_Observation,
                Activity_IsInternal: data.Activity_IsInternal,
                Activity_StatusMobile: data.Activity_StatusMobile || null, // Asegurar que este campo sea opcional
                Activity_Document: file ? file.buffer : null // Almacenar el archivo si existe
            }, { transaction: t });
    
            console.log("✅ Actividad creada con ID:", newActivity.Activity_ID);
    
            // Registrar auditoría
            await AuditModel.registerAudit(
                internalId,
                "INSERT",
                "Activity",
                `El usuario interno ${internalId} creó la actividad con ID ${newActivity.Activity_ID}`,
                { transaction: t }
            );
    
            await t.commit();
            return { message: "Actividad creada con éxito", data: newActivity };
        } catch (error) {
            await t.rollback();
            console.error("❌ Error al crear actividad:", error.message);
            throw new Error(`Error creating activity: ${error.message}`);
        }
    }

    static async update(id, activityData, file = null, internalUser) {
        const t = await sequelize.transaction();
        try {
            const existingActivity = await Activity.findOne({
                where: { Activity_Id: id },
                transaction: t
            });

            
            if (!existingActivity) {
                await t.rollback();
                return null; // Activity not found
            }

            // Update the activity data
            await existingActivity.update(activityData, { transaction: t });

            // Check if a file was uploaded
            if (file) {
                // Update the document information
                await existingActivity.update({
                    Activity_Document: file.buffer
                }, { transaction: t });
            }

            const internalId = internalUser || getUserId();
            // Register audit
            await AuditModel.registerAudit(
                internalId,
                "UPDATE",
                "Activity",
                `El usuario interno ${internalId} actualizó la actividad con ID ${id}`,
                { transaction: t }
            );

            await t.commit();
            return existingActivity; // Return the updated activity
        } catch (error) {
            await t.rollback();
            console.error("Error updating activity in model:", error);
            throw error;
        }
    }

    static async generateExcelReportForActivities(startDate, endDate) {
        try {
            const activities = await Activity.findAll({
                where: {
                    Activity_Date: {
                        [Op.between]: [startDate, endDate],
                    },
                },
                include: [
                    {
                        model: InitialConsultations,
                        as: 'Initial_Consultation',
                        include: [{ model: User, as: 'User' }],
                    },
                ],
                order: [['Activity_Date', 'ASC']],
            });
    
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Reporte Actividades');
    
            // Define column headers
            worksheet.columns = [
                { header: 'Nro.', key: 'number', width: 10 },
                { header: 'Fecha de Asignación', key: 'init_date', width: 20 },
                { header: 'CJGA', key: 'cjga', width: 50 },
                { header: 'Provincia', key: 'province', width: 20 },
                { header: 'Ciudad', key: 'city', width: 20 },
                { header: 'Apellidos y Nombres Abogado/a', key: 'lawyer', width: 30 },
                { header: 'Materia >> Tema', key: 'subject_topic', width: 40 },
                { header: 'Apellidos y Nombres Usuario/a', key: 'user_name', width: 30 },
                { header: 'No. Cédula o Pasaporte', key: 'user_id', width: 20 },
                { header: 'Fecha de Nacimiento', key: 'birth_date', width: 20 },
                { header: 'Número de Teléfono', key: 'phone', width: 20 },
                { header: 'Género', key: 'gender', width: 15 },
                { header: 'Etnia', key: 'ethnicity', width: 15 },
                { header: 'País de Origen', key: 'country', width: 20 },
                { header: 'Instrucción', key: 'instruction', width: 20 },
                { header: 'Nivel de Ingresos', key: 'income_level', width: 20 },
                { header: 'Discapacidad', key: 'disability', width: 15 },
                { header: 'Materia - Rol de Usuario', key: 'user_role', width: 30 },
                { header: 'Derivado Por', key: 'referred_by', width: 20 },
                { header: 'Tipo de Judicatura', key: 'judicature_type', width: 20 },
                { header: 'Nro. Juzgado / Unidad Judicial', key: 'court_number', width: 30 },
                { header: 'Última Actividad o Diligencia', key: 'last_activity', width: 40 },
                { header: 'Fecha Última Actividad', key: 'last_activity_date', width: 20 },
                { header: 'Estado', key: 'status', width: 15 },
                { header: 'Observaciones', key: 'observations', width: 40 },
            ];
    
            // Apply styles to the header row
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF4472C4' }, // Blue background
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
    
            // Add data rows
            activities.forEach((activity, index) => {
                const consultation = activity.Initial_Consultation || {};
                const user = consultation.User || {};
                const row = worksheet.addRow({
                    number: index + 1,
                    init_date: moment(consultation.Init_Date).format('DD/MM/YYYY'),
                    cjga: 'Consultorio Jurídico Gratuito de la Pontificia Universidad Católica del Ecuador',
                    province: user.User_Province || 'N/A',
                    city: user.User_City || 'N/A',
                    lawyer: consultation.Init_Lawyer || 'N/A',
                    subject_topic: `${consultation.Init_Subject || ''} >> ${consultation.Init_Topic || ''}`,
                    user_name: `${user.User_FirstName || ''} ${user.User_LastName || ''}`,
                    user_id: user.User_ID || 'N/A',
                    birth_date: user.User_BirthDate ? moment(user.User_BirthDate).format('DD/MM/YYYY') : 'N/A',
                    phone: user.User_Phone || 'N/A',
                    gender: user.User_Gender || 'N/A',
                    ethnicity: user.User_Ethnicity || 'N/A',
                    country: user.User_Nationality || 'N/A',
                    instruction: user.User_AcademicInstruction || 'N/A',
                    income_level: user.User_IncomeLevel || 'N/A',
                    disability: user.User_Disability ? 'Sí' : 'No',
                    user_role: consultation.Init_ClientType || 'N/A',
                    referred_by: consultation.Init_Referral || 'N/A',
                    judicature_type: activity.Activity_JurisdictionType || 'N/A',
                    court_number: activity.Activity_CourtNumber || 'N/A',
                    last_activity: activity.Activity_lastCJGActivity || 'N/A',
                    last_activity_date: activity.Activity_lastCJGActivityDate
                        ? moment(activity.Activity_lastCJGActivityDate).format('DD/MM/YYYY')
                        : 'N/A',
                    status: activity.Activity_Status || 'N/A',
                    observations: activity.Activity_Observation || 'N/A',
                });
    
                // Apply alternating row styles
                if ((index + 1) % 2 === 0) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF2F2F2' }, // Light gray background
                    };
                }
            });
    
            // Enable filters on the header row
            const lastColIndex = worksheet.columns.length - 1;
            const lastColName = String.fromCharCode(65 + lastColIndex); // Convert column index to letter
            worksheet.autoFilter = `A1:${lastColName}1`;
    
            // Generate buffer
            const buffer = await workbook.xlsx.writeBuffer();
            return buffer;
        } catch (error) {
            console.error('Error generating Excel report for activities:', error);
            throw new Error(`Error generating Excel report: ${error.message}`);
        }
    }
}