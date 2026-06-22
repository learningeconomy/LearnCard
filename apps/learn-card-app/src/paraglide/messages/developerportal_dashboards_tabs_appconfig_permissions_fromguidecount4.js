/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Appconfig_Permissions_Fromguidecount4Inputs */

const en_developerportal_dashboards_tabs_appconfig_permissions_fromguidecount4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Fromguidecount4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} from guide setup`)
};

const es_developerportal_dashboards_tabs_appconfig_permissions_fromguidecount4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Fromguidecount4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} de la configuración de la guía`)
};

const fr_developerportal_dashboards_tabs_appconfig_permissions_fromguidecount4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Fromguidecount4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} de la configuration du guide`)
};

const ar_developerportal_dashboards_tabs_appconfig_permissions_fromguidecount4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Fromguidecount4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} من إعداد الدليل`)
};

/**
* | output |
* | --- |
* | "{count} from guide setup" |
*
* @param {Developerportal_Dashboards_Tabs_Appconfig_Permissions_Fromguidecount4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_appconfig_permissions_fromguidecount4 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Appconfig_Permissions_Fromguidecount4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Appconfig_Permissions_Fromguidecount4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_appconfig_permissions_fromguidecount4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_appconfig_permissions_fromguidecount4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_appconfig_permissions_fromguidecount4(inputs)
	return ar_developerportal_dashboards_tabs_appconfig_permissions_fromguidecount4(inputs)
});
export { developerportal_dashboards_tabs_appconfig_permissions_fromguidecount4 as "developerPortal.dashboards.tabs.appConfig.permissions.fromGuideCount" }