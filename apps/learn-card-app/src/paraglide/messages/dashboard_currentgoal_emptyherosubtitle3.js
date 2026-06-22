/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Currentgoal_Emptyherosubtitle3Inputs */

const en_dashboard_currentgoal_emptyherosubtitle3 = /** @type {(inputs: Dashboard_Currentgoal_Emptyherosubtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pick a goal and we'll map a personal path with the steps, skills, and credentials to get there.`)
};

const es_dashboard_currentgoal_emptyherosubtitle3 = /** @type {(inputs: Dashboard_Currentgoal_Emptyherosubtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige una meta y trazaremos un camino personal con los pasos, las habilidades y las credenciales para alcanzarla.`)
};

const fr_dashboard_currentgoal_emptyherosubtitle3 = /** @type {(inputs: Dashboard_Currentgoal_Emptyherosubtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez un objectif et nous tracerons un parcours personnel avec les étapes, les compétences et les certifications pour y parvenir.`)
};

const ar_dashboard_currentgoal_emptyherosubtitle3 = /** @type {(inputs: Dashboard_Currentgoal_Emptyherosubtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر هدفًا وسنرسم لك مسارًا شخصيًا بالخطوات والمهارات والشهادات اللازمة للوصول إليه.`)
};

/**
* | output |
* | --- |
* | "Pick a goal and we'll map a personal path with the steps, skills, and credentials to get there." |
*
* @param {Dashboard_Currentgoal_Emptyherosubtitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_currentgoal_emptyherosubtitle3 = /** @type {((inputs?: Dashboard_Currentgoal_Emptyherosubtitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Currentgoal_Emptyherosubtitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_currentgoal_emptyherosubtitle3(inputs)
	if (locale === "es") return es_dashboard_currentgoal_emptyherosubtitle3(inputs)
	if (locale === "fr") return fr_dashboard_currentgoal_emptyherosubtitle3(inputs)
	return ar_dashboard_currentgoal_emptyherosubtitle3(inputs)
});
export { dashboard_currentgoal_emptyherosubtitle3 as "dashboard.currentGoal.emptyHeroSubtitle" }