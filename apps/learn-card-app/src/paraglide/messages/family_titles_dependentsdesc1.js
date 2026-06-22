/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Titles_Dependentsdesc1Inputs */

const en_family_titles_dependentsdesc1 = /** @type {(inputs: Family_Titles_Dependentsdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dependent accounts exist only in the family that they are created in. They have no personal login and limited permissions in LearnCard.`)
};

const es_family_titles_dependentsdesc1 = /** @type {(inputs: Family_Titles_Dependentsdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las cuentas de dependientes existen solo en la familia en la que se crean. No tienen inicio de sesión personal y tienen permisos limitados en LearnCard.`)
};

const fr_family_titles_dependentsdesc1 = /** @type {(inputs: Family_Titles_Dependentsdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les comptes de personnes à charge n'existent que dans la famille où ils sont créés. Ils n'ont pas de connexion personnelle et disposent d'autorisations limitées dans LearnCard.`)
};

const ar_family_titles_dependentsdesc1 = /** @type {(inputs: Family_Titles_Dependentsdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حسابات التابعين موجودة فقط في العائلة التي أُنشئت فيها. ليس لها تسجيل دخول شخصي ولديها أذونات محدودة في LearnCard.`)
};

/**
* | output |
* | --- |
* | "Dependent accounts exist only in the family that they are created in. They have no personal login and limited permissions in LearnCard." |
*
* @param {Family_Titles_Dependentsdesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_titles_dependentsdesc1 = /** @type {((inputs?: Family_Titles_Dependentsdesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Titles_Dependentsdesc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_titles_dependentsdesc1(inputs)
	if (locale === "es") return es_family_titles_dependentsdesc1(inputs)
	if (locale === "fr") return fr_family_titles_dependentsdesc1(inputs)
	return ar_family_titles_dependentsdesc1(inputs)
});
export { family_titles_dependentsdesc1 as "family.titles.dependentsDesc" }