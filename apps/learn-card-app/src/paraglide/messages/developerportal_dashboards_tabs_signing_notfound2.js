/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Signing_Notfound2Inputs */

const en_developerportal_dashboards_tabs_signing_notfound2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Notfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No signing authority found`)
};

const es_developerportal_dashboards_tabs_signing_notfound2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Notfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontró autoridad de firma`)
};

const fr_developerportal_dashboards_tabs_signing_notfound2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Notfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune autorité de signature trouvée`)
};

const ar_developerportal_dashboards_tabs_signing_notfound2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Signing_Notfound2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على سلطة توقيع`)
};

/**
* | output |
* | --- |
* | "No signing authority found" |
*
* @param {Developerportal_Dashboards_Tabs_Signing_Notfound2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_signing_notfound2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Signing_Notfound2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Signing_Notfound2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_signing_notfound2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_signing_notfound2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_signing_notfound2(inputs)
	return ar_developerportal_dashboards_tabs_signing_notfound2(inputs)
});
export { developerportal_dashboards_tabs_signing_notfound2 as "developerPortal.dashboards.tabs.signing.notFound" }