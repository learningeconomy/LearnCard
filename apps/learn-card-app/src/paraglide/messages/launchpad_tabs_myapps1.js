/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Tabs_Myapps1Inputs */

const en_launchpad_tabs_myapps1 = /** @type {(inputs: Launchpad_Tabs_Myapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`My Apps`)
};

const es_launchpad_tabs_myapps1 = /** @type {(inputs: Launchpad_Tabs_Myapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mis aplicaciones`)
};

const de_launchpad_tabs_myapps1 = /** @type {(inputs: Launchpad_Tabs_Myapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Meine Apps`)
};

const ar_launchpad_tabs_myapps1 = /** @type {(inputs: Launchpad_Tabs_Myapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيقاتي`)
};

const fr_launchpad_tabs_myapps1 = /** @type {(inputs: Launchpad_Tabs_Myapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mes applications`)
};

const ko_launchpad_tabs_myapps1 = /** @type {(inputs: Launchpad_Tabs_Myapps1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`내 앱`)
};

/**
* | output |
* | --- |
* | "My Apps" |
*
* @param {Launchpad_Tabs_Myapps1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_tabs_myapps1 = /** @type {((inputs?: Launchpad_Tabs_Myapps1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Tabs_Myapps1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_tabs_myapps1(inputs)
	if (locale === "es") return es_launchpad_tabs_myapps1(inputs)
	if (locale === "de") return de_launchpad_tabs_myapps1(inputs)
	if (locale === "ar") return ar_launchpad_tabs_myapps1(inputs)
	if (locale === "fr") return fr_launchpad_tabs_myapps1(inputs)
	return ko_launchpad_tabs_myapps1(inputs)
});
export { launchpad_tabs_myapps1 as "launchpad.tabs.myApps" }