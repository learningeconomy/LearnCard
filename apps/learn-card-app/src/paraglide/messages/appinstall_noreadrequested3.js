/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Noreadrequested3Inputs */

const en_appinstall_noreadrequested3 = /** @type {(inputs: Appinstall_Noreadrequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No read permissions requested`)
};

const es_appinstall_noreadrequested3 = /** @type {(inputs: Appinstall_Noreadrequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se solicitan permisos de lectura`)
};

const fr_appinstall_noreadrequested3 = /** @type {(inputs: Appinstall_Noreadrequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune autorisation de lecture demandée`)
};

const ar_appinstall_noreadrequested3 = /** @type {(inputs: Appinstall_Noreadrequested3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يُطلب أي أذونات قراءة`)
};

/**
* | output |
* | --- |
* | "No read permissions requested" |
*
* @param {Appinstall_Noreadrequested3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_noreadrequested3 = /** @type {((inputs?: Appinstall_Noreadrequested3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Noreadrequested3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_noreadrequested3(inputs)
	if (locale === "es") return es_appinstall_noreadrequested3(inputs)
	if (locale === "fr") return fr_appinstall_noreadrequested3(inputs)
	return ar_appinstall_noreadrequested3(inputs)
});
export { appinstall_noreadrequested3 as "appInstall.noReadRequested" }