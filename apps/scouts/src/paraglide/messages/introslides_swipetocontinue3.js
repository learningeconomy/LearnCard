/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Introslides_Swipetocontinue3Inputs */

const en_introslides_swipetocontinue3 = /** @type {(inputs: Introslides_Swipetocontinue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Swipe right to Continue`)
};

const es_introslides_swipetocontinue3 = /** @type {(inputs: Introslides_Swipetocontinue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desliza hacia la derecha para Continuar`)
};

const fr_introslides_swipetocontinue3 = /** @type {(inputs: Introslides_Swipetocontinue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Balayez vers la droite pour continuer`)
};

const ar_introslides_swipetocontinue3 = /** @type {(inputs: Introslides_Swipetocontinue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Swipe right to Continue`)
};

/**
* | output |
* | --- |
* | "Swipe right to Continue" |
*
* @param {Introslides_Swipetocontinue3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const introslides_swipetocontinue3 = /** @type {((inputs?: Introslides_Swipetocontinue3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Introslides_Swipetocontinue3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_introslides_swipetocontinue3(inputs)
	if (locale === "es") return es_introslides_swipetocontinue3(inputs)
	if (locale === "fr") return fr_introslides_swipetocontinue3(inputs)
	return ar_introslides_swipetocontinue3(inputs)
});
export { introslides_swipetocontinue3 as "introSlides.swipeToContinue" }