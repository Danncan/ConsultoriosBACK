import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

/*
CREATE TABLE Internal_User (
    Internal_ID CHAR(10) PRIMARY KEY,
    Internal_FullName CHAR(75),
    Internal_Email CHAR(50),
    Internal_Type CHAR(50), -- e.g., "Coordinator", "Student", etc.
    Internal_Area CHAR(50), -- The area they work in (Civil, Criminal, etc.)
    Internal_Phone CHAR(10),
    Internal_Password CHAR(50)
);
*/

export const InternalUser = sequelize.define('Internal_User', {
    Internal_ID: {
        type: DataTypes.CHAR(15), //Cedula de identidad o Pasaporte
        primaryKey: true
    },
    Internal_Name: DataTypes.STRING(50),
    Internal_LastName: DataTypes.STRING(50),
    Internal_Email: {
        type: DataTypes.STRING(50),
        unique: true
    },
    Internal_Password: DataTypes.STRING(256),
    Internal_Type: DataTypes.STRING(50), // Example: "Coordinator", "Student", etc.
    Internal_Area: DataTypes.STRING(50), // The area of work (e.g., Civil, Criminal, etc.)
    Internal_Phone: DataTypes.STRING(10),
    Internal_Huella:{
        type: DataTypes.BLOB('long')
    },
    Internal_Status: DataTypes.STRING(50), // Example: "Active", "Inactive", etc.

}, { timestamps: false });

