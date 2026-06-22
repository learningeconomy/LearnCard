/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Activity_Emptysubtitle1Inputs */

const en_dashboard_activity_emptysubtitle1 = /** @type {(inputs: Dashboard_Activity_Emptysubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We'll let you know here when someone wants to connect or send you a credential.`)
};

const es_dashboard_activity_emptysubtitle1 = /** @type {(inputs: Dashboard_Activity_Emptysubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Te avisaremos aquí cuando alguien quiera conectarse o enviarte una credencial.`)
};

const fr_dashboard_activity_emptysubtitle1 = /** @type {(inputs: Dashboard_Activity_Emptysubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous vous préviendrons ici lorsque quelqu'un voudra se connecter ou vous envoyer une certification.`)
};

const ar_dashboard_activity_emptysubtitle1 = /** @type {(inputs: Dashboard_Activity_Emptysubtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سنُعلمك هنا عندما يرغب أحدهم في التواصل معك أو إرسال شهادة إليك.`)
};

/**
* | output |
* | --- |
* | "We'll let you know here when someone wants to connect or send you a credential." |
*
* @param {Dashboard_Activity_Emptysubtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_emptysubtitle1 = /** @type {((inputs?: Dashboard_Activity_Emptysubtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_Emptysubtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_emptysubtitle1(inputs)
	if (locale === "es") return es_dashboard_activity_emptysubtitle1(inputs)
	if (locale === "fr") return fr_dashboard_activity_emptysubtitle1(inputs)
	return ar_dashboard_activity_emptysubtitle1(inputs)
});
export { dashboard_activity_emptysubtitle1 as "dashboard.activity.emptySubtitle" }