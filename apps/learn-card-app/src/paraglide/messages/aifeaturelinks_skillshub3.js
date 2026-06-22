/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aifeaturelinks_Skillshub3Inputs */

const en_aifeaturelinks_skillshub3 = /** @type {(inputs: Aifeaturelinks_Skillshub3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skills Hub`)
};

const es_aifeaturelinks_skillshub3 = /** @type {(inputs: Aifeaturelinks_Skillshub3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Centro de habilidades`)
};

const fr_aifeaturelinks_skillshub3 = /** @type {(inputs: Aifeaturelinks_Skillshub3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pôle de compétences`)
};

const ar_aifeaturelinks_skillshub3 = /** @type {(inputs: Aifeaturelinks_Skillshub3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مركز المهارات`)
};

/**
* | output |
* | --- |
* | "Skills Hub" |
*
* @param {Aifeaturelinks_Skillshub3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aifeaturelinks_skillshub3 = /** @type {((inputs?: Aifeaturelinks_Skillshub3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aifeaturelinks_Skillshub3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aifeaturelinks_skillshub3(inputs)
	if (locale === "es") return es_aifeaturelinks_skillshub3(inputs)
	if (locale === "fr") return fr_aifeaturelinks_skillshub3(inputs)
	return ar_aifeaturelinks_skillshub3(inputs)
});
export { aifeaturelinks_skillshub3 as "aiFeatureLinks.skillsHub" }