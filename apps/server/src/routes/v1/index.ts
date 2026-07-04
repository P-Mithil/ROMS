import { Router, type IRouter } from "express";
import { healthRouter } from "./health.routes.js";
import { authRouter } from "../../modules/auth/auth.routes.js";
import { usersRouter } from "../../modules/users/users.routes.js";
import { departmentsRouter } from "../../modules/departments/departments.routes.js";
import { requisitionsRouter } from "../../modules/requisitions/requisitions.routes.js";
import { candidatesRouter } from "../../modules/candidates/candidates.routes.js";
import { interviewsRouter } from "../../modules/interviews/interviews.routes.js";
import { offersRouter } from "../../modules/offers/offers.routes.js";
import { publicOffersRouter } from "../../modules/offers/public-offers.routes.js";
import { onboardingRouter } from "../../modules/onboarding/onboarding.routes.js";
import { employeesRouter } from "../../modules/employees/employees.routes.js";

export const v1Router: IRouter = Router();

v1Router.use(healthRouter);
v1Router.use("/public", publicOffersRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/users", usersRouter);
v1Router.use("/departments", departmentsRouter);
v1Router.use("/requisitions", requisitionsRouter);
v1Router.use("/candidates", candidatesRouter);
v1Router.use("/interviews", interviewsRouter);
v1Router.use("/offers", offersRouter);
v1Router.use("/onboarding", onboardingRouter);
v1Router.use("/employees", employeesRouter);
