/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Contracts_Infobanner2Inputs */

const en_developerportal_dashboards_tabs_contracts_infobanner2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Infobanner2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`These contracts are referenced in your integration code. Users will see a consent prompt when your app requests access via these contracts.`)
};

const es_developerportal_dashboards_tabs_contracts_infobanner2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Infobanner2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estos contratos se referencian en tu código de integración. Los usuarios verán un mensaje de consentimiento cuando tu app solicite acceso mediante estos contratos.`)
};

const fr_developerportal_dashboards_tabs_contracts_infobanner2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Infobanner2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ces contrats sont référencés dans votre code d'intégration. Les utilisateurs verront une invite de consentement lorsque votre application demande l'accès via ces contrats.`)
};

const ar_developerportal_dashboards_tabs_contracts_infobanner2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Contracts_Infobanner2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تتم الإشارة إلى هذه العقود في كود التكامل الخاص بك. سيرى المستخدمون مطالبة بالموافقة عندما يطلب تطبيقك الوصول عبر هذه العقود.`)
};

/**
* | output |
* | --- |
* | "These contracts are referenced in your integration code. Users will see a consent prompt when your app requests access via these contracts." |
*
* @param {Developerportal_Dashboards_Tabs_Contracts_Infobanner2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_contracts_infobanner2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Contracts_Infobanner2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Contracts_Infobanner2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_contracts_infobanner2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_contracts_infobanner2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_contracts_infobanner2(inputs)
	return ar_developerportal_dashboards_tabs_contracts_infobanner2(inputs)
});
export { developerportal_dashboards_tabs_contracts_infobanner2 as "developerPortal.dashboards.tabs.contracts.infoBanner" }