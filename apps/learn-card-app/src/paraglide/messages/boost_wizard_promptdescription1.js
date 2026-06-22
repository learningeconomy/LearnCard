/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Wizard_Promptdescription1Inputs */

const en_boost_wizard_promptdescription1 = /** @type {(inputs: Boost_Wizard_Promptdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use simple words to describe why you admire someone, what they accomplished, why they are great, etc.`)
};

const es_boost_wizard_promptdescription1 = /** @type {(inputs: Boost_Wizard_Promptdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa palabras sencillas para describir por qué admiras a alguien, qué logró, por qué es genial, etc.`)
};

const fr_boost_wizard_promptdescription1 = /** @type {(inputs: Boost_Wizard_Promptdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisez des mots simples pour décrire pourquoi vous admirez quelqu'un, ce qu'il a accompli, pourquoi il est exceptionnel, etc.`)
};

const ar_boost_wizard_promptdescription1 = /** @type {(inputs: Boost_Wizard_Promptdescription1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم كلمات بسيطة لوصف سبب إعجابك بشخص ما، وما الذي أنجزه، ولماذا هو رائع، وما إلى ذلك.`)
};

/**
* | output |
* | --- |
* | "Use simple words to describe why you admire someone, what they accomplished, why they are great, etc." |
*
* @param {Boost_Wizard_Promptdescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_wizard_promptdescription1 = /** @type {((inputs?: Boost_Wizard_Promptdescription1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Wizard_Promptdescription1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_wizard_promptdescription1(inputs)
	if (locale === "es") return es_boost_wizard_promptdescription1(inputs)
	if (locale === "fr") return fr_boost_wizard_promptdescription1(inputs)
	return ar_boost_wizard_promptdescription1(inputs)
});
export { boost_wizard_promptdescription1 as "boost.wizard.promptDescription" }