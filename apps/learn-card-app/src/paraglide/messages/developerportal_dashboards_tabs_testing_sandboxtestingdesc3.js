/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Sandboxtestingdesc3Inputs */

const en_developerportal_dashboards_tabs_testing_sandboxtestingdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sandboxtestingdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send a test credential to your own email or user ID to verify everything is configured correctly. Sample data will be used for dynamic fields.`)
};

const es_developerportal_dashboards_tabs_testing_sandboxtestingdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sandboxtestingdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envía una credencial de prueba a tu propio correo o ID de usuario para verificar que todo esté configurado correctamente. Se usarán datos de muestra para los campos dinámicos.`)
};

const fr_developerportal_dashboards_tabs_testing_sandboxtestingdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sandboxtestingdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyez un credential de test à votre propre email ou ID utilisateur pour vérifier que tout est correctement configuré. Des exemples de données seront utilisés pour les champs dynamiques.`)
};

const ar_developerportal_dashboards_tabs_testing_sandboxtestingdesc3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Sandboxtestingdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أرسل بيانات اعتماد اختبارية إلى بريدك الإلكتروني أو معرف المستخدم الخاص بك للتحقق من أن كل شيء مهيأ بشكل صحيح. سيتم استخدام بيانات نموذجية للحقول الديناميكية.`)
};

/**
* | output |
* | --- |
* | "Send a test credential to your own email or user ID to verify everything is configured correctly. Sample data will be used for dynamic fields." |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Sandboxtestingdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_sandboxtestingdesc3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Sandboxtestingdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Sandboxtestingdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_sandboxtestingdesc3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_sandboxtestingdesc3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_sandboxtestingdesc3(inputs)
	return ar_developerportal_dashboards_tabs_testing_sandboxtestingdesc3(inputs)
});
export { developerportal_dashboards_tabs_testing_sandboxtestingdesc3 as "developerPortal.dashboards.tabs.testing.sandboxTestingDesc" }