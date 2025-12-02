export enum LoginTypesEnum {
    email = 'email',
    phone = 'phone',
    scoutsSSO = 'scoutsSSO',
}

export enum EmailFormStepsEnum {
    email = 'email',
    passwordExistingUser = 'passwordExistingUser',
    passwordNewUser = 'passwordNewUser',
    verification = 'verification',
}

export enum PhoneFormStepsEnum {
    phone = 'phone',
    verification = 'verification',
    passwordExistingUser = 'passwordExistingUser',
    passwordNewUser = 'passwordNewUser',
}
