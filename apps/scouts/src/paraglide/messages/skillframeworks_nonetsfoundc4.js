/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Nonetsfoundc4Inputs */

const en_skillframeworks_nonetsfoundc4 = /** @type {(inputs: Skillframeworks_Nonetsfoundc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No networks found. Create a network (membership/ID boost) first.`)
};

const es_skillframeworks_nonetsfoundc4 = /** @type {(inputs: Skillframeworks_Nonetsfoundc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron redes. Crea una red (boost de membresía/ID) primero.`)
};

const fr_skillframeworks_nonetsfoundc4 = /** @type {(inputs: Skillframeworks_Nonetsfoundc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun réseau trouvé. Créez d'abord un réseau (Boost d'adhésion/ID).`)
};

const ar_skillframeworks_nonetsfoundc4 = /** @type {(inputs: Skillframeworks_Nonetsfoundc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على شبكات. أنشئ شبكة (عضوية/تعزيز معرف) أولاً.`)
};

/**
* | output |
* | --- |
* | "No networks found. Create a network (membership/ID boost) first." |
*
* @param {Skillframeworks_Nonetsfoundc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_nonetsfoundc4 = /** @type {((inputs?: Skillframeworks_Nonetsfoundc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Nonetsfoundc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_nonetsfoundc4(inputs)
	if (locale === "es") return es_skillframeworks_nonetsfoundc4(inputs)
	if (locale === "fr") return fr_skillframeworks_nonetsfoundc4(inputs)
	return ar_skillframeworks_nonetsfoundc4(inputs)
});
export { skillframeworks_nonetsfoundc4 as "skillFrameworks.noNetsFoundC" }