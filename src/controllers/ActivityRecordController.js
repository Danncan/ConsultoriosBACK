import { ActivityRecordModel } from "../models/ActivityRecordModel.js";
import { AuditModel } from "../models/AuditModel.js";
import { InternalUserModel } from "../models/InternalUserModel.js";

export class ActivityRecordController {
    static async getAll(req, res) {
        try {
            const records = await ActivityRecordModel.getAll();
            res.json(records);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getById(req, res) {
        const { id } = req.params;
        try {
            const record = await ActivityRecordModel.getById(id);
            if (record) return res.json(record);
            res.status(404).json({ message: "Activity record not found" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getByActivityId(req, res) {
        const { activityId } = req.params;
        try {
            const records = await ActivityRecordModel.getAllByActivityId(activityId);
            if (records) return res.json(records);
            res.status(404).json({ message: "Activity records not found" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

        static async create(req, res) {
            try {
                console.log("📥 Received request to create activity record...");
                const internalId = req.headers["internal-id"];

                if (!req.body.Activity_ID || !req.body.Activity_Record_Type || 
                    !req.body.Activity_Record_Recorded_Time || 
                    req.body.Activity_Record_Latitude === undefined || 
                    req.body.Activity_Record_Longitude === undefined || 
                    req.body.Activity_Record_On_Time === undefined) {
                return res.status(400).json({ error: "Missing required fields" });
                }

                const newRecord = await ActivityRecordModel.create(req.body, internalId);
                console.log("✅ Activity record created successfully.");

                res.status(201).json(newRecord); // ya viene listo del modelo
            } catch (error) {
                console.error("❌ Error creating activity record:", error.message);
                res.status(500).json({ error: error.message });
            }
        }


    static async update(req, res) {
        try {
            const { id } = req.params;
            const internalId = req.headers["internal-id"];

            const updatedRecord = await ActivityRecordModel.update(id, req.body, internalId);
            if (!updatedRecord) return res.status(404).json({ message: "Activity record not found" });

            return res.json(updatedRecord);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const internalId = req.headers["internal-id"];

            const deletedRecord = await ActivityRecordModel.delete(id, internalId);
            if (!deletedRecord) return res.status(404).json({ message: "Activity record not found" });

            return res.json({ 
                message: "Activity record deleted successfully", 
                record: deletedRecord 
            });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}