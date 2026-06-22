/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Template_Erroraliasinuse4Inputs */

const en_developerportal_dashboards_template_erroraliasinuse4 = /** @type {(inputs: Developerportal_Dashboards_Template_Erroraliasinuse4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alias already in use`)
};

const es_developerportal_dashboards_template_erroraliasinuse4 = /** @type {(inputs: Developerportal_Dashboards_Template_Erroraliasinuse4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El alias ya está en uso`)
};

const fr_developerportal_dashboards_template_erroraliasinuse4 = /** @type {(inputs: Developerportal_Dashboards_Template_Erroraliasinuse4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'alias est déjà utilisé`)
};

const ar_developerportal_dashboards_template_erroraliasinuse4 = /** @type {(inputs: Developerportal_Dashboards_Template_Erroraliasinuse4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاسم المستعار قيد الاستخدام بالفعل`)
};

/**
* | output |
* | --- |
* | "Alias already in use" |
*
* @param {Developerportal_Dashboards_Template_Erroraliasinuse4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_template_erroraliasinuse4 = /** @type {((inputs?: Developerportal_Dashboards_Template_Erroraliasinuse4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Template_Erroraliasinuse4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_template_erroraliasinuse4(inputs)
	if (locale === "es") return es_developerportal_dashboards_template_erroraliasinuse4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_template_erroraliasinuse4(inputs)
	return ar_developerportal_dashboards_template_erroraliasinuse4(inputs)
});
export { developerportal_dashboards_template_erroraliasinuse4 as "developerPortal.dashboards.template.errorAliasInUse" }