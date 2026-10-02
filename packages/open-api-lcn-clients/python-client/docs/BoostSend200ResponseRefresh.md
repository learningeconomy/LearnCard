# BoostSend200ResponseRefresh

Present when managed refresh was requested: issuance metadata the issuer keeps to publish future updates

## Properties

| Name                  | Type                                                                                                                | Description | Notes      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **refresh_id**        | **str**                                                                                                             |             |
| **refresh_service**   | [**BoostSend200ResponseInboxRefreshRefreshService**](BoostSend200ResponseInboxRefreshRefreshService.md)             |             |
| **credential_id**     | **str**                                                                                                             |             |
| **issuer_did**        | **str**                                                                                                             |             |
| **holder_did**        | **str**                                                                                                             |             |
| **credential_status** | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md) |             | [optional] |

## Example

```python
from openapi_client.models.boost_send200_response_refresh import BoostSend200ResponseRefresh

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSend200ResponseRefresh from a JSON string
boost_send200_response_refresh_instance = BoostSend200ResponseRefresh.from_json(json)
# print the JSON string representation of the object
print(BoostSend200ResponseRefresh.to_json())

# convert the object into a dict
boost_send200_response_refresh_dict = boost_send200_response_refresh_instance.to_dict()
# create an instance of BoostSend200ResponseRefresh from a dict
boost_send200_response_refresh_from_dict = BoostSend200ResponseRefresh.from_dict(boost_send200_response_refresh_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
