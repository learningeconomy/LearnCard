/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Fwupdatedmsg3Inputs */

const en_skillframeworks_fwupdatedmsg3 = /** @type {(inputs: Skillframeworks_Fwupdatedmsg3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework has been successfully updated.`)
};

const es_skillframeworks_fwupdatedmsg3 = /** @type {(inputs: Skillframeworks_Fwupdatedmsg3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El marco se ha actualizado exitosamente.`)
};

const fr_skillframeworks_fwupdatedmsg3 = /** @type {(inputs: Skillframeworks_Fwupdatedmsg3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le cadre a été mis à jour avec succès.`)
};

const ar_skillframeworks_fwupdatedmsg3 = /** @type {(inputs: Skillframeworks_Fwupdatedmsg3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Framework has been successfully updated.`)
};

/**
* | output |
* | --- |
* | "Framework has been successfully updated." |
*
* @param {Skillframeworks_Fwupdatedmsg3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_fwupdatedmsg3 = /** @type {((inputs?: Skillframeworks_Fwupdatedmsg3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Fwupdatedmsg3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_fwupdatedmsg3(inputs)
	if (locale === "es") return es_skillframeworks_fwupdatedmsg3(inputs)
	if (locale === "fr") return fr_skillframeworks_fwupdatedmsg3(inputs)
	return ar_skillframeworks_fwupdatedmsg3(inputs)
});
export { skillframeworks_fwupdatedmsg3 as "skillFrameworks.fwUpdatedMsg" }