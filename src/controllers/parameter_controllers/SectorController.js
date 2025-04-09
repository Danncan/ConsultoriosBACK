import { SectorModel } from "../../models/parameter_models/SectorModel.js";

export class SectorController {

    static async getAll(req, res) {
        try {
            const data = await SectorModel.getAll();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const data = await SectorModel.getById(id);
            if (!data) return res.status(404).json({ message: "Sector not found" });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getSectorZone(req, res) {
        try {
            const { id } = req.params;
            const data = await SectorModel.getSectorZone(id);
            if (!data) return res.status(404).json({ message: "Sector not found" });
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async create(req, res) {
        try {
            if (Array.isArray(req.body)) {
                const createdSector = await SectorModel.bulkCreate(req.body);
                return res.status(201).json(createdSector);
            }
            // Si es un objeto, usa create normal
            const newSector = await SectorModel.bulkCreate(req.body);
            res.status(201).json(newSector);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const updatedSector = await SectorModel.update(id, req.body);
            if (!updatedSector) return res.status(404).json({ message: "Sector not found or no changes made" });
            res.status(200).json(updatedSector);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const deletedSector = await SectorModel.delete(id);
            if (!deletedSector) return res.status(404).json({ message: "Sector not found" });
            res.status(200).json(deletedSector);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
