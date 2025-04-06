import { InitialConsultationsModel } from "../models/InitialConsultationsModel.js";
import { AssignmentModel } from "../models/AssignmentModel.js";

export class FirstConsultationsController {
    static async getFirstConsultations(req, res) {
        try {
            const consultations = await InitialConsultationsModel.getAll();
            res.json(consultations);
        } catch (error) {
            res.status(500).json(error);
        }
    }

    static async getById(req, res) {
        const { id } = req.params;
        try {
            const consultation = await InitialConsultationsModel.getById(id);
            if (consultation) return res.json(consultation);
            res.status(404).json({ message: "First consultation not found" });
        } catch (error) {
            res.status(500).json(error);
        }
    }

    static async findById(req, res) {
        const { id } = req.params;
        try {
            const consultation = await InitialConsultationsModel.findById(id);
            if (consultation) return res.json(consultation);
            res.status(404).json({ message: "First consultation not found" });
        }
        catch (error) {
            res.status(500).json(error);
        }
    }

    static async getByStatus(req, res) {
        const { status } = req.params;
        try {
            const consultations = await InitialConsultationsModel.getByStatus(status);
            res.json(consultations);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getByUserId(req, res) {
        const { userId } = req.params;
        try {
            const consultations = await InitialConsultationsModel.getByUserId(userId);
            res.json(consultations);
        }
        catch (error) {
            res.status(500).json(error);
        }
    }

    static async getByInitTypeAndSubjectAndStatus(req, res) {
        try {
            const { initSubject, initType, initStatus } = req.params;
    
            if (!initType || !initStatus) {
                return res.status(400).json({ message: "initType and initStatus are required" });
            }
    
            const consultations = await InitialConsultationsModel.getByInitTypeAndSubjectCases(initType, initSubject, initStatus);
            res.status(200).json(consultations);
        } catch (error) {
            res.status(500).json({ message: "Error fetching consultations", error });
        }
    }

    static async getByTypeAndStatus(req, res) {
        try {
            const { initType, initStatus } = req.params;
    
            if (!initType || !initStatus) {
                return res.status(400).json({ message: "initType and initStatus are required" });
            }
    
            const consultations = await InitialConsultationsModel.getByTypeAndStatus(initType, initStatus);
            res.status(200).json(consultations);
        } catch (error) {
            res.status(500).json({ message: "Error fetching consultations", error });
        }
    }



    static async createFirstConsultations(req, res) {
        try {
            console.log("📂 Archivos recibidos:", req.files);
    
            // Crear un objeto con los archivos recibidos
            const files = {
                evidenceFile: req.files?.evidenceFile ? req.files.evidenceFile[0] : null,
                healthDocuments: req.files?.healthDocuments ? req.files.healthDocuments[0] : null
            };
    
            // 🔹 Llamar al método del modelo pasando los archivos correctamente
            const newConsultation = await InitialConsultationsModel.createInitialConsultation(req.body, files);
    
            res.status(201).json({ message: "Consulta inicial creada", data: newConsultation });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }


    static async createNewConsultation(req, res) {
        try {
            // const internalId = req.headers["internal-id"];
            // if (!internalId) {
            //     return res.status(400).json({ error: "El Internal_ID es obligatorio para registrar la acción" });
            // }

            const newConsultation = await InitialConsultationsModel.createNewConsultation(req.body);

            res.status(201).json({ message: "Consulta inicial creada", data: newConsultation });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            //const internalId = req.headers["internal-id"];  // ✅ Se obtiene el usuario interno desde los headers

            const updatedConsultation = await InitialConsultationsModel.update(id, req.body);

            if (!updatedConsultation) return res.status(404).json({ message: "Consulta inicial no encontrada" });

            return res.json(updatedConsultation);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            //const internalId = req.headers["internal-id"];  // ✅ Se obtiene el usuario interno desde los headers

            const deletedConsultation = await InitialConsultationsModel.delete(id);

            if (!deletedConsultation) return res.status(404).json({ message: "Consulta inicial no encontrada" });

            return res.json({ message: "Consulta inicial eliminada", data: deletedConsultation });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    static async generateAttentionSheet(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: "El parámetro 'id' es obligatorio." });
            }
    
            const consultation = await InitialConsultationsModel.findById(id);
            if (!consultation) {
                return res.status(404).json({ message: "Consulta inicial no encontrada" });
            }
    
            // Generar el PDF en memoria usando la función existente
            const pdfBuffer = await InitialConsultationsModel.generateAttentionSheetBuffer(consultation);
            if (!pdfBuffer) {
                return res.status(500).json({ message: "Error generando el PDF" });
            }
    
            console.log(Buffer.isBuffer(pdfBuffer)); // Verifica que sea un Buffer
    
            // Actualizar el campo Init_AttentionSheet con el nuevo PDF
            await InitialConsultationsModel.update(id, { Init_AttentionSheet: pdfBuffer });
    
            // Enviar el PDF al front-end para visualizar
            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="FichaDeAtencion_${id}.pdf"`,
                "Content-Length": pdfBuffer.length,
            });
            return res.send(pdfBuffer);
        } catch (error) {
            console.error("Error generando la ficha de atención:", error);
            return res.status(500).json({ error: error.message });
        }
    }
    
    





}
