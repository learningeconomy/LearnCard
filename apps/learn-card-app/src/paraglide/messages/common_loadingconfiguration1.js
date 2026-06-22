/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Loadingconfiguration1Inputs */

const en_common_loadingconfiguration1 = /** @type {(inputs: Common_Loadingconfiguration1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading configuration settings…`)
};

const es_common_loadingconfiguration1 = /** @type {(inputs: Common_Loadingconfiguration1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando configuración…`)
};

const fr_common_loadingconfiguration1 = /** @type {(inputs: Common_Loadingconfiguration1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des paramètres de configuration…`)
};

const ar_common_loadingconfiguration1 = /** @type {(inputs: Common_Loadingconfiguration1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل إعدادات التكوين…`)
};

/**
* | output |
* | --- |
* | "Loading configuration settings…" |
*
* @param {Common_Loadingconfiguration1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_loadingconfiguration1 = /** @type {((inputs?: Common_Loadingconfiguration1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Loadingconfiguration1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_loadingconfiguration1(inputs)
	if (locale === "es") return es_common_loadingconfiguration1(inputs)
	if (locale === "fr") return fr_common_loadingconfiguration1(inputs)
	return ar_common_loadingconfiguration1(inputs)
});
export { common_loadingconfiguration1 as "common.loadingConfiguration" }