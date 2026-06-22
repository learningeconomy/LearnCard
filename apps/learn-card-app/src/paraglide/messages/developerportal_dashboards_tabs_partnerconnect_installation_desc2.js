/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Desc2Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_installation_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Install the SDK and initialize it in your app`)
};

const es_developerportal_dashboards_tabs_partnerconnect_installation_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Instala el SDK e inicialízalo en tu aplicación`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_installation_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installez le SDK et initialisez-le dans votre application`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_installation_desc2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Desc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتثبيت SDK وتهيئته في تطبيقك`)
};

/**
* | output |
* | --- |
* | "Install the SDK and initialize it in your app" |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Desc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_installation_desc2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Desc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Installation_Desc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_installation_desc2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_installation_desc2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_installation_desc2(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_installation_desc2(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_installation_desc2 as "developerPortal.dashboards.tabs.partnerConnect.installation.desc" }