import { Social_Work } from "../schemas/Social_Work.js";
import { AuditModel } from "./AuditModel.js"; // Para registrar en auditoría
import { InitialConsultations } from "../schemas/Initial_Consultations.js";
import { User } from "../schemas/User.js";
import { getUserId } from '../sessionData.js';
import ExcelJS from "exceljs";
import { Op } from "sequelize";
import { LivingGroup } from "../schemas/Living_Group.js"; // Assuming LivingGroup is defined in schemas


export class Social_WorkModel {
    // Obtener todas las evaluaciones de trabajo social
    static async getAll() {
        try {
            return await Social_Work.findAll();
        } catch (error) {
            throw new Error(`Error retrieving social work records: ${error.message}`);
        }
    }

    // New method to get all users with social work records
    static async getAllUsersWithSocialWork() {
        try {
            // We're querying from User and including necessary relations
            const users = await User.findAll({
                include: [
                    {
                        model: InitialConsultations,
                        required: true, // Only include users that have an initial consultation
                        include: [
                            {
                                model: Social_Work,
                                required: true // Only include initial consultations that have social work records
                            }
                        ]
                    }
                ]
            });
            
            // Log the structure of the first user for debugging
            if (users.length > 0) {
                console.log("Sample user data structure:", JSON.stringify({
                    userId: users[0].User_ID,
                    firstName: users[0].User_FirstName,
                    consultations: users[0].Initial_Consultations ? 
                      users[0].Initial_Consultations.length : 'none',
                    firstConsultationId: users[0].Initial_Consultations && 
                      users[0].Initial_Consultations.length > 0 ? 
                      users[0].Initial_Consultations[0].Init_Code : 'none',
                    socialWorkId: users[0].Initial_Consultations && 
                      users[0].Initial_Consultations.length > 0 && 
                      users[0].Initial_Consultations[0].SocialWork ? 
                      users[0].Initial_Consultations[0].SocialWork.SW_ProcessNumber : 'none'
                }, null, 2));
            }
            
            return users;
        } catch (error) {
            console.error("Error in getAllUsersWithSocialWork:", error);
            throw new Error(`Error retrieving users with social work records: ${error.message}`);
        }
    }
    
    // Obtener una evaluación de trabajo social por ID
    static async getById(id) {
        try {
            // Retrieve the social work record with related data
            const social_WorkRecord = await Social_Work.findOne({
                where: { SW_ProcessNumber: id },
                include: [
                    {
                        model: InitialConsultations,
                        attributes: ["User_ID", "Init_Subject"],
                        include: [
                            {
                                model: User,
                                attributes: [
                                    "User_ID",
                                    "User_FirstName",
                                    "User_LastName",
                                    "User_Age",
                                    "User_MaritalStatus",
                                    "User_Profession",
                                    "User_Phone"
                                ]
                            }
                        ]
                    }
                ]
            });
    
            // Return the raw database record or null if not found
            return social_WorkRecord || null;
        } catch (error) {
            console.error("Error in getById:", error);
            throw new Error(`Error retrieving social work record: ${error.message}`);
        }
    }

    // Obtener User_ID desde Social_Work a través de Init_Code
    static async getUserIdBySocial_Work(initCode) {
        try {
            const social_WorkRecord = await Social_Work.findOne({
                where: { Init_Code: initCode },
                include: [
                    {
                        model: InitialConsultations,
                        attributes: ["User_ID"],
                        include: [
                            {
                                model: User,
                                attributes: ["User_ID", "User_FirstName", "User_LastName", "User_Email"]
                            }
                        ]
                    }
                ]
            });

            if (!social_WorkRecord || !social_WorkRecord.Initial_Consultation) {
                return null;
            }

            return social_WorkRecord.Initial_Consultation.User;
        } catch (error) {
            throw new Error(`Error retrieving User_ID from Social_Work using Init_Code ${initCode}: ${error.message}`);
        }
    }
    static async getSocial_WorkById(social_WorkId) {
        try {
            const social_Work = await Social_Work.findOne({
                where: { SW_ProcessNumber: social_WorkId },
                include: [
                    {
                        model: InitialConsultations,
                        attributes: ["User_ID"],
                        include: [
                            {
                                model: User,
                                attributes: ["User_ID", "User_FirstName", "User_LastName"]
                            }
                        ]
                    }
                ]
            });
    
            return social_Work; // Return the result or null if not found
        } catch (error) {
            console.error("Error fetching social work by ID:", error);
            throw new Error("Database error when fetching social work");
        }
    }
    // Crear una evaluación de trabajo social
    static async create(data, req, internalUser) {
        try {
            // 🔹 Obtener `Internal_ID` desde el middleware
            const internalId = internalUser || getUserId();
            
            

            // 🔹 Verificar si el `Init_Code` existe en la tabla `InitialConsultations`
            const initialConsultation = await InitialConsultations.findOne({ 
                where: { Init_Code: data.Init_Code } 
            });

            if (!initialConsultation) {
                throw new Error(`No existe una consulta inicial con Init_Code ${data.Init_Code}`);
            }

            // 🔹 Crear el registro en `Social_Work`
            const newRecord = await Social_Work.create({
                Init_Code: data.Init_Code,
                SW_UserRequests: data.SW_UserRequests || null,
                SW_ReferralAreaRequests: data.SW_ReferralAreaRequests || null,
                SW_ViolenceEpisodes: data.SW_ViolenceEpisodes || null,
                SW_Complaints: data.SW_Complaints || null,
                SW_DisabilityType: data.SW_DisabilityType || null,
                SW_DisabilityPercentage: data.SW_DisabilityPercentage || null,
                SW_HasDisabilityCard: data.SW_HasDisabilityCard || false,
                SW_Status: data.SW_Status || "Activo"
            });

            // 🔹 Registrar en auditoría
            await AuditModel.registerAudit(
                internalId,
                "INSERT",
                "Social_Work",
                `El usuario interno ${internalId} creó el registro de trabajo social con ID ${newRecord.SW_ProcessNumber}`
            );

            return newRecord;
        } catch (error) {
            throw new Error(`Error creating social work record: ${error.message}`);
        }
    }

    // Actualizar una evaluación de trabajo social
    static async update(id, data, internalUser) {
        try {
            const record = await this.getById(id);
            if (!record) return null;

            const internalId = internalUser || getUserId();
            const [rowsUpdated] = await Social_Work.update(data, { where: { SW_ProcessNumber: id } });

            if (rowsUpdated === 0) return null;
            
            // 🔹 Registrar en auditoría la actualización
            await AuditModel.registerAudit(
                internalId,
                "UPDATE",
                "Social_Work",
                `El usuario interno ${internalId} actualizó el registro de trabajo social con ID ${id}`
            );

            return await this.getById(id);
        } catch (error) {
          throw new Error(`Error updating social work record: ${error.message}`);
        }
      }
    static async updateStatus(social_WorkId, status, status_observations) { // Parameter is socialWorkId
        try {
            // First check if the record exists
            const record = await this.getById(social_WorkId); // <-- Using social_WorkId here (with underscore) - This is line 221
            
            if (!record) {
                return false;
            }
            
            // Fix: Corrected parameter name from status_obvervations to status_observations
            const [rowsUpdated] = await Social_Work.update(
                {
                    SW_Status: status,
                    SW_Status_Observations: status_observations
                },
                {
                    where: { SW_ProcessNumber: social_WorkId } // <-- Using social_WorkId here (with underscore)
                }
            );
    
            return rowsUpdated > 0; // Return true if at least one row was updated
        } catch (error) {
            console.error("Error updating social work status:", error);
            throw new Error("Database error when updating social work status");
        }
    }


    // Eliminar (borrado lógico) una evaluación de trabajo social
    static async delete(id, internalUser) {
        try {
            const record = await this.getById(id);
            if (!record) return null;
            
            const internalId = internalUser || getUserId();
            await Social_Work.update({ SW_Status: false }, { where: { SW_ProcessNumber: id } });

            // 🔹 Registrar en auditoría la eliminación (borrado lógico)
            await AuditModel.registerAudit(
                internalId,
                "DELETE",
                "Social_Work",
                `El usuario interno ${internalId} eliminó lógicamente el registro de trabajo social con ID ${id}`
            );

            return record;
        } catch (error) {
            throw new Error(`Error deleting social work record: ${error.message}`);
        }
    }


    static async generateExcelReport(startDate, endDate) {
    try {
        // Fetch data from SocialWork with proper includes for related data
        const socialWorkRecords = await Social_Work.findAll({
            where: {
                SW_EntryDate: {
                    [Op.between]: [startDate, endDate],
                },
            },
            include: [
                {
                    model: InitialConsultations,
                    // Use the exact association name as defined in your model
                    as: 'Initial_Consultation', // Make sure this matches your association alias
                    attributes: ["Init_Code", "Init_Subject", "User_ID"],
                    include: [
                        {
                            model: User,
                            attributes: [
                                "User_ID",
                                "User_FirstName", 
                                "User_LastName",
                                "User_Age",
                                "User_MaritalStatus",
                                "User_Profession",
                                "User_Phone"
                            ]
                        }
                    ]
                },
                {
                    model: LivingGroup,
                    as: 'LivingGroups', // Make sure this matches your association alias
                    attributes: ["LG_Name", "LG_Relationship", "LG_Age", "LG_Occupation", "LG_Notes"],
                    required: false // This makes it a LEFT JOIN so records without living groups are still included
                }
            ]
        });

        // Debug: Log the structure of the first record to verify the associations
        if (socialWorkRecords.length > 0) {
            console.log("Social Work Record Structure:", JSON.stringify({
                processNumber: socialWorkRecords[0].SW_ProcessNumber,
                initCode: socialWorkRecords[0].Init_Code,
                hasInitialConsultation: !!socialWorkRecords[0].Initial_Consultation,
                hasUser: !!socialWorkRecords[0].Initial_Consultation?.User,
                userFirstName: socialWorkRecords[0].Initial_Consultation?.User?.User_FirstName,
                hasLivingGroups: !!socialWorkRecords[0].LivingGroups,
                livingGroupsCount: socialWorkRecords[0].LivingGroups?.length || 0
            }, null, 2));
        }

        // Create a new Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Social Work Report");

        // Define the header row (keeping your existing column definitions)
        worksheet.columns = [
            { header: "Número de Proceso", key: "SW_ProcessNumber", width: 20 },
            { header: "Fecha de ingreso", key: "SW_EntryDate", width: 20, style: { numFmt: 'dd/mm/yyyy' } },
            { header: "Estado", key: "SW_Status", width: 25 },
            { header: "Código Consulta Inicial", key: "Init_Code", width: 25 },
            { header: "Usuario (Nombre)", key: "User_FullName", width: 30 },
            { header: "Usuario (C.I.)", key: "User_ID", width: 15 },
            { header: "Asunto Consulta Inicial", key: "Init_Subject", width: 30 },
            { header: "Pedido del Usuario", key: "SW_UserRequests", width: 30 },
            { header: "Pedido del Área de remisión", key: "SW_ReferralAreaRequests", width: 30 },
            { header: "Lugar del Trabajo", key: "SW_WorkAdress", width: 20 },
            { header: "Dirección Domiciliaria", key: "SW_HomeAdress", width: 30 },
            { header: "Teléfono de referencia", key: "SW_ReferencePhone", width: 20 },
            { header: "Tipo de discapacidad", key: "SW_DisabilityType", width: 20 },
            { header: "Porcentaje de discapacidad", key: "SW_DisabilityPercentage", width: 20 },
            { header: "Tiene carnet de discapacidad", key: "SW_HasDisabilityCard", width: 25 },
            { header: "Episodios de Violencia", key: "SW_ViolenceEpisodes", width: 20 },
            { header: "Denuncias", key: "SW_Complaints", width: 20 },
            { header: "Consumo de Alcohol", key: "SW_AlcoholConsumption", width: 20 },
            { header: "Consumo de Drogas", key: "SW_DrugConsumption", width: 20 },
            { header: "Ingresos ($)", key: "SW_Income", width: 20, style: { numFmt: '"$"#,##0.00' } },
            { header: "Tipo de Vivienda", key: "SW_HousingType", width: 20 },
            { header: "Contraparte: Nombres y Apellidos", key: "SW_CounterpartName", width: 30 },
            { header: "Contraparte: Edad", key: "SW_CounterpartAge", width: 10 },
            { header: "Contraparte: Estado Civil", key: "SW_CounterpartMaritalStatus", width: 20 },
            { header: "Contraparte: Ocupación", key: "SW_CounterpartOccupation", width: 20 },
            { header: "Contraparte: Dirección Domiciliaria", key: "SW_CounterpartAddress", width: 30 },
            { header: "Contraparte: Teléfono", key: "SW_CounterpartPhone", width: 20 },
            { header: "Contraparte: C.I", key: "SW_CounterpartID", width: 20 },
            { header: "Contraparte: Relación con el usuario", key: "SW_CounterpartRelation", width: 30 },
            { header: "Caso conocido por otra institución", key: "SW_PreviouslyKnownCase", width: 30 },
            { header: "Relato de Hechos (Trabajo Social)", key: "SW_FactsReport", width: 30 },
            { header: "Observaciones", key: "SW_Observations", width: 30 },
            // Living group columns
            { header: "Grupo Convivencia: Nombre", key: "LG_Name", width: 30 },
            { header: "Grupo Convivencia: Edad", key: "LG_Age", width: 10 },
            { header: "Grupo Convivencia: Parentesco", key: "LG_Relationship", width: 20 },
            { header: "Grupo Convivencia: Ocupación", key: "LG_Occupation", width: 20 },
            { header: "Grupo Convivencia: Notas", key: "LG_Notes", width: 30 }
        ];

        // Populate the worksheet with data
        socialWorkRecords.forEach((record) => {
            // Safely extract user information with proper null checking
            const user = record.Initial_Consultation?.User;
            const userFullName = user ? 
                `${user.User_FirstName || ''} ${user.User_LastName || ''}`.trim() : 
                'N/A';
            const userId = user?.User_ID || 'N/A';
            const initSubject = record.Initial_Consultation?.Init_Subject || 'N/A';

            // Base data for each social work record
            const baseData = {
                SW_ProcessNumber: record.SW_ProcessNumber,
                SW_EntryDate: record.SW_EntryDate,
                SW_Status: record.SW_Status,
                Init_Code: record.Init_Code,
                User_FullName: userFullName,
                User_ID: userId,
                Init_Subject: initSubject,
                SW_UserRequests: record.SW_UserRequests || '',
                SW_ReferralAreaRequests: record.SW_ReferralAreaRequests || '',
                SW_WorkAdress: record.SW_WorkAdress || '',
                SW_HomeAdress: record.SW_HomeAdress || '',
                SW_ReferencePhone: record.SW_ReferencePhone || '',
                SW_DisabilityType: record.SW_DisabilityType || '',
                SW_DisabilityPercentage: record.SW_DisabilityPercentage || '',
                SW_HasDisabilityCard: record.SW_HasDisabilityCard ? 'Sí' : 'No',
                SW_ViolenceEpisodes: record.SW_ViolenceEpisodes || '',
                SW_Complaints: record.SW_Complaints || '',
                SW_AlcoholConsumption: record.SW_AlcoholConsumption || '',
                SW_DrugConsumption: record.SW_DrugConsumption || '',
                SW_Income: record.SW_Income || 0,
                SW_HousingType: record.SW_HousingType || '',
                SW_CounterpartName: record.SW_CounterpartName || '',
                SW_CounterpartAge: record.SW_CounterpartAge || '',
                SW_CounterpartMaritalStatus: record.SW_CounterpartMaritalStatus || '',
                SW_CounterpartOccupation: record.SW_CounterpartOccupation || '',
                SW_CounterpartAddress: record.SW_CounterpartAddress || '',
                SW_CounterpartPhone: record.SW_CounterpartPhone || '',
                SW_CounterpartID: record.SW_CounterpartID || '',
                SW_CounterpartRelation: record.SW_CounterpartRelation || '',
                SW_PreviouslyKnownCase: record.SW_PreviouslyKnownCase || '',
                SW_FactsReport: record.SW_FactsReport || record.SW_Notes || '',
                SW_Observations: record.SW_Observations || '',
            };

            // Handle living group members
            const livingGroupMembers = record.LivingGroups || [];

            if (livingGroupMembers.length > 0) {
                // Create a row for each living group member
                livingGroupMembers.forEach((lg) => {
                    worksheet.addRow({
                        ...baseData,
                        LG_Name: lg.LG_Name || '',
                        LG_Relationship: lg.LG_Relationship || '',
                        LG_Age: lg.LG_Age || '',
                        LG_Occupation: lg.LG_Occupation || '',
                        LG_Notes: lg.LG_Notes || '',
                    });
                });
            } else {
                // Add a single row with empty living group data
                worksheet.addRow({
                    ...baseData,
                    LG_Name: '',
                    LG_Relationship: '',
                    LG_Age: '',
                    LG_Occupation: '',
                    LG_Notes: '',
                });
            }
        });

        // Generate the Excel file as a buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    } catch (error) {
        console.error("Error generating Excel report:", error);
        throw new Error(`Error generating Excel report: ${error.message}`);
    }
}
    
}