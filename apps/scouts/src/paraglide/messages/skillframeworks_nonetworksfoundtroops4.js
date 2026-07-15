/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Nonetworksfoundtroops4Inputs */

const en_skillframeworks_nonetworksfoundtroops4 = /** @type {(inputs: Skillframeworks_Nonetworksfoundtroops4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No networks found. Create a Global or National network first from the Troops page.`)
};

const es_skillframeworks_nonetworksfoundtroops4 = /** @type {(inputs: Skillframeworks_Nonetworksfoundtroops4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron redes. Crea una red Global o Nacional desde la página de Troops.`)
};

const fr_skillframeworks_nonetworksfoundtroops4 = /** @type {(inputs: Skillframeworks_Nonetworksfoundtroops4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun réseau trouvé. Créez d'abord un réseau mondial ou national depuis la page Troupes.`)
};

const ar_skillframeworks_nonetworksfoundtroops4 = /** @type {(inputs: Skillframeworks_Nonetworksfoundtroops4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No networks found. Create a Global or National network first from the Troops page.`)
};

/**
* | output |
* | --- |
* | "No networks found. Create a Global or National network first from the Troops page." |
*
* @param {Skillframeworks_Nonetworksfoundtroops4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_nonetworksfoundtroops4 = /** @type {((inputs?: Skillframeworks_Nonetworksfoundtroops4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Nonetworksfoundtroops4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_nonetworksfoundtroops4(inputs)
	if (locale === "es") return es_skillframeworks_nonetworksfoundtroops4(inputs)
	if (locale === "fr") return fr_skillframeworks_nonetworksfoundtroops4(inputs)
	return ar_skillframeworks_nonetworksfoundtroops4(inputs)
});
export { skillframeworks_nonetworksfoundtroops4 as "skillFrameworks.noNetworksFoundTroops" }