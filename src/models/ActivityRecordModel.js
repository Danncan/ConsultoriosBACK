import { AuditModel } from "../models/AuditModel.js";
import { Activity } from "../schemas/Activity.js";
import { ActivityRecord } from "../schemas/Activity_Record.js";
import { sequelize } from "../database/database.js";
import { getUserId } from '../sessionData.js';

export class ActivityRecordModel {
    static async getAll() {
        try {
            return await ActivityRecord.findAll();
        } catch (error) {
            throw new Error(`Error retrieving activity records: ${error.message}`);
        }
    }

    static async getById(id) {
        try {
            return await ActivityRecord.findOne({
                where: { Record_ID: id }
            });
        } catch (error) {
            throw new Error(`Error retrieving activity record: ${error.message}`);
        }
    }

    static async getAllByActivityId(activityId) {
        try {
            return await ActivityRecord.findAll({
                where: { Activity_ID: activityId }
            });
        } catch (error) {
            throw new Error(`Error retrieving activity records: ${error.message}`);
        }
    }

        static async create(data, internalUser) {
            const t = await sequelize.transaction();
            try {
            const internalId = internalUser || getUserId();

            console.log("📥 Creando registro de actividad para Activity_ID:", data.Activity_ID);

            // Crear registro de actividad
            // Calcular si está "on time" (menos de 30 minutos de diferencia)
            let onTime = false;
            if (data.Activity_Record_Recorded_Time && data.Activity_Record_On_Time) {
                const recordedTime = new Date(data.Activity_Record_Recorded_Time);
                const onTimeLimit = new Date(data.Activity_Record_On_Time);
                const diffMinutes = Math.abs((recordedTime - onTimeLimit) / (1000 * 60));
                onTime = diffMinutes <= 30;
            }

            const newRecord = await ActivityRecord.create({
                Activity_ID: data.Activity_ID,
                Activity_Record_Type: data.Activity_Record_Type,
                Activity_Record_Recorded_Time: data.Activity_Record_Recorded_Time,
                Activity_Record_Latitude: data.Activity_Record_Latitude,
                Activity_Record_Longitude: data.Activity_Record_Longitude,
                Activity_Record_On_Time: data.Activity_Record_On_Time,
                Activity_Record_Observation: data.Activity_Record_Observation,
                Activity_Record_Is_On_Time: onTime // Nuevo campo para indicar si está a tiempo
            }, { transaction: t });

            console.log("✅ Registro creado con ID:", newRecord.Record_ID);

            // Actualizar estado de la actividad según el tipo de registro
            let nuevoEstado = null;
            if (data.Activity_Record_Type === "entrada") {
                nuevoEstado = "iniciado";
            } else if (data.Activity_Record_Type === "salida") {
                nuevoEstado = "finalizado";
            }
            if (nuevoEstado) {
                await Activity.update(
                    { Activity_StatusMobile: nuevoEstado },
                    { where: { Activity_ID: data.Activity_ID }, transaction: t }
                );
                console.log(`🔄 Estado de actividad actualizado a '${nuevoEstado}'`);
            }

            console.log("🔄 Estado de actividad actualizado a 'iniciado'");

            // Auditar creación
            await AuditModel.registerAudit(
                internalId,
                "INSERT",
                "Activity_Record",
                `El usuario interno ${internalId} creó el registro ${newRecord.Record_ID} y actualizó estado a 'iniciado'`,
                { transaction: t }
            );

            await t.commit();
            return newRecord; // 👈 Devuelve el objeto Sequelize directo
            } catch (error) {
            await t.rollback();
            console.error("❌ Error en creación y actualización:", error.message);
            throw new Error(`Error creando registro de actividad: ${error.message}`);
            }
        }

    static async update(id, data, internalUser) {
        const t = await sequelize.transaction();
        try {
            console.log("📥 Updating activity record with ID:", id);
            const internalId = internalUser || getUserId();

            const record = await this.getById(id);
            if (!record) {
                await t.rollback();
                return null;
            }

            const [rowsUpdated] = await ActivityRecord.update(data, {
                where: { Record_ID: id },
                transaction: t
            });

            if (rowsUpdated === 0) {
                await t.rollback();
                return null;
            }

            const updatedRecord = await this.getById(id);

            await AuditModel.registerAudit(
                internalId,
                "UPDATE",
                "Activity_Record",
                `User ${internalId} updated activity record ${id}`,
                { transaction: t }
            );

            await t.commit();
            return updatedRecord;
        } catch (error) {
            await t.rollback();
            throw new Error(`Error updating activity record: ${error.message}`);
        }
    }

    static async delete(id, internalUser) {
        const t = await sequelize.transaction();
        try {
            const record = await this.getById(id);
            if (!record) {
                await t.rollback();
                return null;
            }

            const internalId = internalUser || getUserId();
            
            await ActivityRecord.destroy({
                where: { Record_ID: id },
                transaction: t
            });

            await AuditModel.registerAudit(
                internalId,
                "DELETE",
                "Activity_Record",
                `User ${internalId} deleted activity record ${id}`,
                { transaction: t }
            );

            await t.commit();
            return record;
        } catch (error) {
            await t.rollback();
            throw new Error(`Error deleting activity record: ${error.message}`);
        }
    }
}