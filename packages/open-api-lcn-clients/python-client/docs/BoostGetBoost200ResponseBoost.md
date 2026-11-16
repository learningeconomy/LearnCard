# BoostGetBoost200ResponseBoost

## Properties

| Name                   | Type                                                                                                                  | Description | Notes      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **context**            | [**List[BoostSendBoostRequestCredentialAnyOfContextInner]**](BoostSendBoostRequestCredentialAnyOfContextInner.md)     |             |
| **id**                 | **str**                                                                                                               |             | [optional] |
| **type**               | **List[str]**                                                                                                         |             |
| **issuer**             | [**BoostGetBoost200ResponseBoostIssuer**](BoostGetBoost200ResponseBoostIssuer.md)                                     |             |
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
| **render_method**      | [**BoostGetBoost200ResponseBoostRenderMethod**](BoostGetBoost200ResponseBoostRenderMethod.md)                         |             | [optional] |

## Example

```python
from openapi_client.models.boost_get_boost200_response_boost import BoostGetBoost200ResponseBoost

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoost200ResponseBoost from a JSON string
boost_get_boost200_response_boost_instance = BoostGetBoost200ResponseBoost.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoost200ResponseBoost.to_json())

# convert the object into a dict
boost_get_boost200_response_boost_dict = boost_get_boost200_response_boost_instance.to_dict()
# create an instance of BoostGetBoost200ResponseBoost from a dict
boost_get_boost200_response_boost_from_dict = BoostGetBoost200ResponseBoost.from_dict(boost_get_boost200_response_boost_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
