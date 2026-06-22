/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Template_Errorcreaterequires3Inputs */

const en_developerportal_dashboards_template_errorcreaterequires3 = /** @type {(inputs: Developerportal_Dashboards_Template_Errorcreaterequires3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Either listingId or integrationId is required to create templates`)
};

const es_developerportal_dashboards_template_errorcreaterequires3 = /** @type {(inputs: Developerportal_Dashboards_Template_Errorcreaterequires3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se requiere listingId o integrationId para crear plantillas`)
};

const fr_developerportal_dashboards_template_errorcreaterequires3 = /** @type {(inputs: Developerportal_Dashboards_Template_Errorcreaterequires3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`listingId ou integrationId est requis pour créer des modèles`)
};

const ar_developerportal_dashboards_template_errorcreaterequires3 = /** @type {(inputs: Developerportal_Dashboards_Template_Errorcreaterequires3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطلوب listingId أو integrationId لإنشاء القوالب`)
};

/**
* | output |
* | --- |
* | "Either listingId or integrationId is required to create templates" |
*
* @param {Developerportal_Dashboards_Template_Errorcreaterequires3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_template_errorcreaterequires3 = /** @type {((inputs?: Developerportal_Dashboards_Template_Errorcreaterequires3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Template_Errorcreaterequires3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_template_errorcreaterequires3(inputs)
	if (locale === "es") return es_developerportal_dashboards_template_errorcreaterequires3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_template_errorcreaterequires3(inputs)
	return ar_developerportal_dashboards_template_errorcreaterequires3(inputs)
});
export { developerportal_dashboards_template_errorcreaterequires3 as "developerPortal.dashboards.template.errorCreateRequires" }