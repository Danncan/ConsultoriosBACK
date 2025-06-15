import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";
import { InternalUser } from "./Internal_User.js";
import { InitialConsultations } from "./Initial_Consultations.js";

export const Activity = sequelize.define('Activity', {
    Activity_ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Init_Code: {
        type: DataTypes.CHAR(50),
        allowNull: false
    },
    Internal_ID: {
        type: DataTypes.CHAR(15),
        allowNull: false
    },
    Activity_Type: {
        type: DataTypes.STRING(100)
    },
    Activity_Description: {
        type: DataTypes.STRING(250)
    },
    Activity_Location: {
        type: DataTypes.STRING(250)
    },
    Activity_Date: {
        type: DataTypes.DATE
    },
    Activity_StartTime: {
        type: DataTypes.TIME
    },
    activityScheduledTime: {
        type: DataTypes.TIME
    },
    Activity_Status: {
        type: DataTypes.STRING(50)
    },
    Activity_JurisdictionType: {
        type: DataTypes.STRING(50)
    },
    Activity_InternalReference: {
        type: DataTypes.STRING(25)
    },
    Activity_CourtNumber: {
        type: DataTypes.STRING(50)
    },
    Activity_lastCJGActivity: {
        type: DataTypes.STRING(250)
    },
    Activity_lastCJGActivityDate: {
        type: DataTypes.DATE
    },
    Activity_Observation: {
        type: DataTypes.TEXT
    },
    Activity_IsInternal: {  
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    Activity_Document: {
        type: DataTypes.BLOB("long"),
        allowNull: true
    },
    Activity_StatusMobile: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
}, { timestamps: false });

// Define associations
Activity.belongsTo(InitialConsultations, { foreignKey: "Init_Code" });
InitialConsultations.hasMany(Activity, { foreignKey: "Init_Code" });

Activity.belongsTo(InternalUser, { foreignKey: "Internal_ID" });
InternalUser.hasMany(Activity, { foreignKey: "Internal_ID" });
