/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Activity_Notifdevicelinkrequest3Inputs */

const en_dashboard_activity_notifdevicelinkrequest3 = /** @type {(inputs: Dashboard_Activity_Notifdevicelinkrequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Device link request`)
};

const es_dashboard_activity_notifdevicelinkrequest3 = /** @type {(inputs: Dashboard_Activity_Notifdevicelinkrequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitud de vínculo de dispositivo`)
};

const fr_dashboard_activity_notifdevicelinkrequest3 = /** @type {(inputs: Dashboard_Activity_Notifdevicelinkrequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande de liaison d'appareil`)
};

const ar_dashboard_activity_notifdevicelinkrequest3 = /** @type {(inputs: Dashboard_Activity_Notifdevicelinkrequest3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب ربط جهاز`)
};

/**
* | output |
* | --- |
* | "Device link request" |
*
* @param {Dashboard_Activity_Notifdevicelinkrequest3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_activity_notifdevicelinkrequest3 = /** @type {((inputs?: Dashboard_Activity_Notifdevicelinkrequest3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Activity_Notifdevicelinkrequest3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_activity_notifdevicelinkrequest3(inputs)
	if (locale === "es") return es_dashboard_activity_notifdevicelinkrequest3(inputs)
	if (locale === "fr") return fr_dashboard_activity_notifdevicelinkrequest3(inputs)
	return ar_dashboard_activity_notifdevicelinkrequest3(inputs)
});
export { dashboard_activity_notifdevicelinkrequest3 as "dashboard.activity.notifDeviceLinkRequest" }