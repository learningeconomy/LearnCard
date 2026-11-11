# BoostSendRequestTemplateCredentialAnyOf

## Properties

| Name                   | Type                                                                                                                  | Description | Notes      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **context**            | [**List[BoostSendBoostRequestCredentialAnyOfContextInner]**](BoostSendBoostRequestCredentialAnyOfContextInner.md)     |             |
| **id**                 | **str**                                                                                                               |             | [optional] |
| **type**               | **List[str]**                                                                                                         |             |
| **issuer**             | [**BoostSendRequestTemplateCredentialAnyOfIssuer**](BoostSendRequestTemplateCredentialAnyOfIssuer.md)                 |             |
| **credential_subject** | [**BoostSendBoostRequestCredentialAnyOfCredentialSubject**](BoostSendBoostRequestCredentialAnyOfCredentialSubject.md) |             |
| **refresh_service**    | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md)       |             | [optional] |
| **credential_schema**  | [**BoostSendBoostRequestCredentialAnyOfCredentialSchema**](BoostSendBoostRequestCredentialAnyOfCredentialSchema.md)   |             | [optional] |
| **issuance_date**      | **str**                                                                                                               |             | [optional] |
| **expiration_date**    | **str**                                                                                                               |             | [optional] |
| **credential_status**  | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md)       |             | [optional] |
| **name**               | **str**                                                                                                               |             | [optional] |
| **description**        | **str**                                                                                                               |             | [optional] |
| **valid_from**         | **str**                                                                                                               |             | [optional] |
| **valid_until**        | **str**                                                                                                               |             | [optional] |
| **status**             | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md)       |             | [optional] |
| **terms_of_use**       | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md)       |             | [optional] |
| **evidence**           | [**BoostSendBoostRequestCredentialAnyOfEvidence**](BoostSendBoostRequestCredentialAnyOfEvidence.md)                   |             | [optional] |
| **render_method**      | [**BoostSendBoostRequestCredentialAnyOfRenderMethod**](BoostSendBoostRequestCredentialAnyOfRenderMethod.md)           |             | [optional] |
| **proof**              | [**BoostSendBoostRequestCredentialAnyOfProof**](BoostSendBoostRequestCredentialAnyOfProof.md)                         |             |

## Example

```python
from openapi_client.models.boost_send_request_template_credential_any_of import BoostSendRequestTemplateCredentialAnyOf

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendRequestTemplateCredentialAnyOf from a JSON string
boost_send_request_template_credential_any_of_instance = BoostSendRequestTemplateCredentialAnyOf.from_json(json)
# print the JSON string representation of the object
print(BoostSendRequestTemplateCredentialAnyOf.to_json())

# convert the object into a dict
boost_send_request_template_credential_any_of_dict = boost_send_request_template_credential_any_of_instance.to_dict()
# create an instance of BoostSendRequestTemplateCredentialAnyOf from a dict
boost_send_request_template_credential_any_of_from_dict = BoostSendRequestTemplateCredentialAnyOf.from_dict(boost_send_request_template_credential_any_of_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
