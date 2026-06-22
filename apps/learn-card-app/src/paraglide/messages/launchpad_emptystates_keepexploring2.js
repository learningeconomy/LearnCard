/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ appName: NonNullable<unknown> }} Launchpad_Emptystates_Keepexploring2Inputs */

const en_launchpad_emptystates_keepexploring2 = /** @type {(inputs: Launchpad_Emptystates_Keepexploring2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Keep exploring ${i?.appName}! Credentials you earn will appear here.`)
};

const es_launchpad_emptystates_keepexploring2 = /** @type {(inputs: Launchpad_Emptystates_Keepexploring2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¡Sigue explorando ${i?.appName}! Las credenciales que obtengas aparecerán aquí.`)
};

const fr_launchpad_emptystates_keepexploring2 = /** @type {(inputs: Launchpad_Emptystates_Keepexploring2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Continuez à explorer ${i?.appName} ! Les justificatifs que vous obtenez apparaîtront ici.`)
};

const ar_launchpad_emptystates_keepexploring2 = /** @type {(inputs: Launchpad_Emptystates_Keepexploring2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`استمر في استكشاف ${i?.appName}! ستظهر بيانات الاعتماد التي تكسبها هنا.`)
};

/**
* | output |
* | --- |
* | "Keep exploring {appName}! Credentials you earn will appear here." |
*
* @param {Launchpad_Emptystates_Keepexploring2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_emptystates_keepexploring2 = /** @type {((inputs: Launchpad_Emptystates_Keepexploring2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Emptystates_Keepexploring2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_emptystates_keepexploring2(inputs)
	if (locale === "es") return es_launchpad_emptystates_keepexploring2(inputs)
	if (locale === "fr") return fr_launchpad_emptystates_keepexploring2(inputs)
	return ar_launchpad_emptystates_keepexploring2(inputs)
});
export { launchpad_emptystates_keepexploring2 as "launchpad.emptyStates.keepExploring" }