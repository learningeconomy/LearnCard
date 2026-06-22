/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Signing_Createone2Inputs */

const en_developerportal_dashboards_tabs_signing_createone2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Createone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create one below to sign credentials`)
};

const es_developerportal_dashboards_tabs_signing_createone2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Createone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea una a continuación para firmar credenciales`)
};

const fr_developerportal_dashboards_tabs_signing_createone2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Createone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez-en une ci-dessous pour signer des credentials`)
};

const ar_developerportal_dashboards_tabs_signing_createone2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Createone2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ واحدة أدناه لتوقيع بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Create one below to sign credentials" |
*
* @param {Developerportal_Dashboards_Tabs_Signing_Createone2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_signing_createone2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Signing_Createone2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Signing_Createone2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_signing_createone2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_signing_createone2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_signing_createone2(inputs)
	return ar_developerportal_dashboards_tabs_signing_createone2(inputs)
});
export { developerportal_dashboards_tabs_signing_createone2 as "developerPortal.dashboards.tabs.signing.createOne" }