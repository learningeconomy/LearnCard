/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Llmready4Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_integrationcode_llmready4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Llmready4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LLM-Ready: Copy this code and paste it into an AI assistant (like ChatGPT or Claude) along with your requirements. The @llm-config section contains all your template URIs and settings.`)
};

const es_developerportal_dashboards_tabs_partnerconnect_integrationcode_llmready4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Llmready4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listo para LLM: Copia este código y pégalo en un asistente de IA (como ChatGPT o Claude) junto con tus requisitos. La sección @llm-config contiene todos los URI de tus plantillas y configuraciones.`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_integrationcode_llmready4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Llmready4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prêt pour LLM : Copiez ce code et collez-le dans un assistant IA (comme ChatGPT ou Claude) avec vos besoins. La section @llm-config contient tous vos URI de modèles et paramètres.`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_integrationcode_llmready4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Llmready4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاهز لـ LLM: انسخ هذا الكود والصقه في مساعد ذكاء اصطناعي (مثل ChatGPT أو Claude) مع متطلباتك. يحتوي قسم @llm-config على جميع روابط القوالب والإعدادات الخاصة بك.`)
};

/**
* | output |
* | --- |
* | "LLM-Ready: Copy this code and paste it into an AI assistant (like ChatGPT or Claude) along with your requirements. The @llm-config section contains all your ..." |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Llmready4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_integrationcode_llmready4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Llmready4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Integrationcode_Llmready4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_integrationcode_llmready4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_integrationcode_llmready4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_integrationcode_llmready4(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_integrationcode_llmready4(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_integrationcode_llmready4 as "developerPortal.dashboards.tabs.partnerConnect.integrationCode.llmReady" }