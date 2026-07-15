/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Introslides_Badgesdesc2Inputs */

const en_introslides_badgesdesc2 = /** @type {(inputs: Introslides_Badgesdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badges help to recognize values, talents, participation and contributions.`)
};

const es_introslides_badgesdesc2 = /** @type {(inputs: Introslides_Badgesdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las insignias ayudan a reconocer valores, talentos, participación y contribuciones.`)
};

const fr_introslides_badgesdesc2 = /** @type {(inputs: Introslides_Badgesdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les badges aident à reconnaître les valeurs, les talents, la participation et les contributions.`)
};

const ar_introslides_badgesdesc2 = /** @type {(inputs: Introslides_Badgesdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badges help to recognize values, talents, participation and contributions.`)
};

/**
* | output |
* | --- |
* | "Badges help to recognize values, talents, participation and contributions." |
*
* @param {Introslides_Badgesdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const introslides_badgesdesc2 = /** @type {((inputs?: Introslides_Badgesdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Introslides_Badgesdesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_introslides_badgesdesc2(inputs)
	if (locale === "es") return es_introslides_badgesdesc2(inputs)
	if (locale === "fr") return fr_introslides_badgesdesc2(inputs)
	return ar_introslides_badgesdesc2(inputs)
});
export { introslides_badgesdesc2 as "introSlides.badgesDesc" }