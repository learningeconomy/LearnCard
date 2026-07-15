/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ phrase: NonNullable<unknown> }} Userprofile_Confirmbelow2Inputs */

const en_userprofile_confirmbelow2 = /** @type {(inputs: Userprofile_Confirmbelow2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.phrase} below.`)
};

const es_userprofile_confirmbelow2 = /** @type {(inputs: Userprofile_Confirmbelow2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.phrase} abajo.`)
};

const fr_userprofile_confirmbelow2 = /** @type {(inputs: Userprofile_Confirmbelow2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.phrase} ci-dessous.`)
};

const ar_userprofile_confirmbelow2 = /** @type {(inputs: Userprofile_Confirmbelow2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.phrase} below.`)
};

/**
* | output |
* | --- |
* | "{phrase} below." |
*
* @param {Userprofile_Confirmbelow2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_confirmbelow2 = /** @type {((inputs: Userprofile_Confirmbelow2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Confirmbelow2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_confirmbelow2(inputs)
	if (locale === "es") return es_userprofile_confirmbelow2(inputs)
	if (locale === "fr") return fr_userprofile_confirmbelow2(inputs)
	return ar_userprofile_confirmbelow2(inputs)
});
export { userprofile_confirmbelow2 as "userProfile.confirmBelow" }