/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Networkmember4Inputs */

const en_boostcms_networkmember4 = /** @type {(inputs: Boostcms_Networkmember4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network Member`)
};

const es_boostcms_networkmember4 = /** @type {(inputs: Boostcms_Networkmember4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Miembro de la Red`)
};

const fr_boostcms_networkmember4 = /** @type {(inputs: Boostcms_Networkmember4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membre du réseau`)
};

const ar_boostcms_networkmember4 = /** @type {(inputs: Boostcms_Networkmember4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Network Member`)
};

/**
* | output |
* | --- |
* | "Network Member" |
*
* @param {Boostcms_Networkmember4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_networkmember4 = /** @type {((inputs?: Boostcms_Networkmember4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Networkmember4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_networkmember4(inputs)
	if (locale === "es") return es_boostcms_networkmember4(inputs)
	if (locale === "fr") return fr_boostcms_networkmember4(inputs)
	return ar_boostcms_networkmember4(inputs)
});
export { boostcms_networkmember4 as "boostCMS.networkMember" }