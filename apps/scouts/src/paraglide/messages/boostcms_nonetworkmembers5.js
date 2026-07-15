/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Nonetworkmembers5Inputs */

const en_boostcms_nonetworkmembers5 = /** @type {(inputs: Boostcms_Nonetworkmembers5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No network members`)
};

const es_boostcms_nonetworkmembers5 = /** @type {(inputs: Boostcms_Nonetworkmembers5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin miembros de la red`)
};

const fr_boostcms_nonetworkmembers5 = /** @type {(inputs: Boostcms_Nonetworkmembers5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun membre du réseau`)
};

const ar_boostcms_nonetworkmembers5 = /** @type {(inputs: Boostcms_Nonetworkmembers5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يوجد أعضاء شبكة`)
};

/**
* | output |
* | --- |
* | "No network members" |
*
* @param {Boostcms_Nonetworkmembers5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_nonetworkmembers5 = /** @type {((inputs?: Boostcms_Nonetworkmembers5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Nonetworkmembers5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_nonetworkmembers5(inputs)
	if (locale === "es") return es_boostcms_nonetworkmembers5(inputs)
	if (locale === "fr") return fr_boostcms_nonetworkmembers5(inputs)
	return ar_boostcms_nonetworkmembers5(inputs)
});
export { boostcms_nonetworkmembers5 as "boostCMS.noNetworkMembers" }