/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Nonetsfound3Inputs */

const en_skillframeworks_nonetsfound3 = /** @type {(inputs: Skillframeworks_Nonetsfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No networks found. Create a Global or Regional network first from the Membership page.`)
};

const es_skillframeworks_nonetsfound3 = /** @type {(inputs: Skillframeworks_Nonetsfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron redes. Crea una red Global o Regional desde la página de Membresías.`)
};

const fr_skillframeworks_nonetsfound3 = /** @type {(inputs: Skillframeworks_Nonetsfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun réseau trouvé. Créez d'abord un réseau mondial ou régional depuis la page Adhésions.`)
};

const ar_skillframeworks_nonetsfound3 = /** @type {(inputs: Skillframeworks_Nonetsfound3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No networks found. Create a Global or Regional network first from the Membership page.`)
};

/**
* | output |
* | --- |
* | "No networks found. Create a Global or Regional network first from the Membership page." |
*
* @param {Skillframeworks_Nonetsfound3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_nonetsfound3 = /** @type {((inputs?: Skillframeworks_Nonetsfound3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Nonetsfound3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_nonetsfound3(inputs)
	if (locale === "es") return es_skillframeworks_nonetsfound3(inputs)
	if (locale === "fr") return fr_skillframeworks_nonetsfound3(inputs)
	return ar_skillframeworks_nonetsfound3(inputs)
});
export { skillframeworks_nonetsfound3 as "skillFrameworks.noNetsFound" }