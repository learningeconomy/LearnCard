/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Fwcreatedmsg3Inputs */

const en_skillframeworks_fwcreatedmsg3 = /** @type {(inputs: Skillframeworks_Fwcreatedmsg3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`has been successfully created.`)
};

const es_skillframeworks_fwcreatedmsg3 = /** @type {(inputs: Skillframeworks_Fwcreatedmsg3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`se ha creado exitosamente.`)
};

const fr_skillframeworks_fwcreatedmsg3 = /** @type {(inputs: Skillframeworks_Fwcreatedmsg3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`a été créé avec succès.`)
};

const ar_skillframeworks_fwcreatedmsg3 = /** @type {(inputs: Skillframeworks_Fwcreatedmsg3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إنشاؤه بنجاح.`)
};

/**
* | output |
* | --- |
* | "has been successfully created." |
*
* @param {Skillframeworks_Fwcreatedmsg3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_fwcreatedmsg3 = /** @type {((inputs?: Skillframeworks_Fwcreatedmsg3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Fwcreatedmsg3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_fwcreatedmsg3(inputs)
	if (locale === "es") return es_skillframeworks_fwcreatedmsg3(inputs)
	if (locale === "fr") return fr_skillframeworks_fwcreatedmsg3(inputs)
	return ar_skillframeworks_fwcreatedmsg3(inputs)
});
export { skillframeworks_fwcreatedmsg3 as "skillFrameworks.fwCreatedMsg" }