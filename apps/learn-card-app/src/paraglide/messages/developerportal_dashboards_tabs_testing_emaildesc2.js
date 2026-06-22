/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Emaildesc2Inputs */

const en_developerportal_dashboards_tabs_testing_emaildesc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Emaildesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We'll send a test credential to this email so you can verify the claim flow works.`)
};

const es_developerportal_dashboards_tabs_testing_emaildesc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Emaildesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviaremos una credencial de prueba a este correo para que puedas verificar el flujo de reclamo.`)
};

const fr_developerportal_dashboards_tabs_testing_emaildesc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Emaildesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous enverrons un credential de test à cet email pour que vous puissiez vérifier le flux de réclamation.`)
};

const ar_developerportal_dashboards_tabs_testing_emaildesc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Emaildesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سنرسل بيانات اعتماد اختبارية إلى هذا البريد الإلكتروني لتتمكن من التحقق من عملية المطالبة.`)
};

/**
* | output |
* | --- |
* | "We'll send a test credential to this email so you can verify the claim flow works." |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Emaildesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_emaildesc2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Emaildesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Emaildesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_emaildesc2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_emaildesc2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_emaildesc2(inputs)
	return ar_developerportal_dashboards_tabs_testing_emaildesc2(inputs)
});
export { developerportal_dashboards_tabs_testing_emaildesc2 as "developerPortal.dashboards.tabs.testing.emailDesc" }