import express from 'express'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth_routes.js'

import {ActivityRouter} from './routes/activity_routes.js'
import {AssignmentRouter} from './routes/assignment_routes.js'
import {EvidenceRouter} from './routes/evidences_routes.js'
import {InitialConsultationsRouter} from './routes/initial_consultations_routes.js'
import {InternalUserRouter} from './routes/internal_user_routes.js'
import {UserRouter} from './routes/user_routes.js'
import { AuditRouter } from './routes/audit_routes.js'
import { corsMiddleware } from './middlewares/cors.js'
import { authMiddleware } from './middlewares/auth.js';

//Parameter Routes
import { CaseStatusRouter } from './routes/parameter_routes/case_status_routes.js'
import { CatastrophicIllnessRouter } from './routes/parameter_routes/catastrophic_illness_routes.js'
import { DisabilityRouter } from './routes/parameter_routes/disability_routes.js'
import { ProfilesRouter } from './routes/parameter_routes/profiles_routes.js'
import { ScheduleRouter } from './routes/parameter_routes/schedule_routes.js'
import { ProtocolsRouter } from './routes/parameter_routes/protocols_routes.js'
import { TypeOfAttentionRouter } from './routes/parameter_routes/type_of_attention_routes.js'
import { VulnerableSituationRouter } from './routes/parameter_routes/vulnerable_situation_routes.js'
import { OccupationsRouter } from './routes/parameter_routes/occupations_routes.js'
import { IncomeLevelRouter } from './routes/parameter_routes/income_level_routes.js'
import { FamilyGroupRouter } from './routes/parameter_routes/family_group_routes.js'
import { FamilyIncomeRouter } from './routes/parameter_routes/family_income_routes.js'
import { TypeOfHousingRouter } from './routes/parameter_routes/type_of_housing_routes.js'
import { OwnAssetsRouter } from './routes/parameter_routes/own_assets_routes.js'
import { PensionerRouter } from './routes/parameter_routes/pensioner_routes.js'
import { HealthInsuranceRouter } from './routes/parameter_routes/health_insurance_routes.js'
import { ZoneRouter } from './routes/parameter_routes/ZoneRoutes.js'
import { SectorRouter } from './routes/parameter_routes/SectorRoutes.js'
import { ProvinceRouter} from './routes/parameter_routes/ProvinceRoutes.js'
import { CityRouter } from './routes/parameter_routes/CityRoutes.js'
import { CountryRouter } from './routes/parameter_routes/CountryRoutes.js'
import { SubjectRouter } from './routes/parameter_routes/SubjectRoutes.js' 
import { TopicRouter } from './routes/parameter_routes/TopicRoutes.js'
import { EthnicityRouter } from './routes/parameter_routes/EthnicityRoutes.js'
import { CivilStatusRouter } from './routes/parameter_routes/CivilStatusRoutes.js'
import { SexRouter } from './routes/parameter_routes/SexRoutes.js'
import { DerivedByRouter } from './routes/parameter_routes/DerivedByRoutes.js'
import { AcademicInstructionRouter } from './routes/parameter_routes/AcademicInstructionRoutes.js'
import {ComplexityRouter} from './routes/parameter_routes/ComplexityRoutes.js'
import {DocumentationBackupRouter} from './routes/parameter_routes/DocumentationBackupRoutes.js'
import {PeriodTypeRouter} from './routes/parameter_routes/PeriodTypeRoutes.js'
import {NumberOfAttemptsRouter} from './routes/parameter_routes/NumberOfAttemptsRoutes.js'
import {PracticalHoursRouter} from './routes/parameter_routes/PracticalHoursRoutes.js'
const app = express()

// middleware
app.use(express.json())
app.use(cookieParser())
app.use(corsMiddleware())
app.use(authRoutes);

//app.use(corsMiddleware())
app.use(ActivityRouter)
app.use(AssignmentRouter)
app.use(EvidenceRouter)
app.use(InitialConsultationsRouter)
app.use(InternalUserRouter)
app.use(UserRouter)
app.use(AuditRouter)

//Parameter Routes
app.use(CaseStatusRouter)
app.use(CatastrophicIllnessRouter)
app.use(DisabilityRouter)
app.use(ProfilesRouter)
app.use(ScheduleRouter)
app.use(ProtocolsRouter)
app.use(TypeOfAttentionRouter)
app.use(VulnerableSituationRouter)
app.use(OccupationsRouter)
app.use(IncomeLevelRouter)
app.use(FamilyGroupRouter)
app.use(FamilyIncomeRouter)
app.use(TypeOfHousingRouter)
app.use(OwnAssetsRouter)
app.use(PensionerRouter)
app.use(HealthInsuranceRouter)
app.use(ZoneRouter)
app.use(SectorRouter)
app.use(ProvinceRouter)
app.use(CityRouter)
app.use(CountryRouter)
app.use(SubjectRouter)
app.use(TopicRouter)
app.use(EthnicityRouter)
app.use(CivilStatusRouter)
app.use(SexRouter)
app.use(DerivedByRouter)
app.use(AcademicInstructionRouter)
app.use(ComplexityRouter)
app.use(DocumentationBackupRouter)
app.use(PeriodTypeRouter)
app.use(NumberOfAttemptsRouter)
app.use(PracticalHoursRouter)

export default app;