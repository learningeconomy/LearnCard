# CredentialsApi

All URIs are relative to *https://network.learncard.com/api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**credentialAcceptCredential**](CredentialsApi.md#credentialAcceptCredential) | **POST** /credential/accept | Accept a Credential |
| [**credentialDeleteCredential**](CredentialsApi.md#credentialDeleteCredential) | **DELETE** /credential | Delete a credential |
| [**credentialIncomingCredentials**](CredentialsApi.md#credentialIncomingCredentials) | **GET** /credentials/incoming | Get incoming credentials |
| [**credentialReceivedCredentials**](CredentialsApi.md#credentialReceivedCredentials) | **GET** /credentials/received | Get received credentials |
| [**credentialSendCredential**](CredentialsApi.md#credentialSendCredential) | **POST** /credential/send/{profileId} | Send a Credential |
| [**credentialSentCredentials**](CredentialsApi.md#credentialSentCredentials) | **GET** /credentials/sent | Get sent credentials |


<a id="credentialAcceptCredential"></a>
# **credentialAcceptCredential**
> Boolean credentialAcceptCredential(credentialAcceptCredentialRequest)

Accept a Credential

This endpoint accepts a credential

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.CredentialsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    CredentialsApi apiInstance = new CredentialsApi(defaultClient);
    CredentialAcceptCredentialRequest credentialAcceptCredentialRequest = new CredentialAcceptCredentialRequest(); // CredentialAcceptCredentialRequest | 
    try {
      Boolean result = apiInstance.credentialAcceptCredential(credentialAcceptCredentialRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling CredentialsApi#credentialAcceptCredential");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **credentialAcceptCredentialRequest** | [**CredentialAcceptCredentialRequest**](CredentialAcceptCredentialRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="credentialDeleteCredential"></a>
# **credentialDeleteCredential**
> Boolean credentialDeleteCredential(uri)

Delete a credential

This endpoint deletes a credential

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.CredentialsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    CredentialsApi apiInstance = new CredentialsApi(defaultClient);
    String uri = "uri_example"; // String | 
    try {
      Boolean result = apiInstance.credentialDeleteCredential(uri);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling CredentialsApi#credentialDeleteCredential");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **uri** | **String**|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="credentialIncomingCredentials"></a>
# **credentialIncomingCredentials**
> List&lt;CredentialReceivedCredentials200ResponseInner&gt; credentialIncomingCredentials(limit, from)

Get incoming credentials

This endpoint returns the current user&#39;s incoming credentials

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.CredentialsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    CredentialsApi apiInstance = new CredentialsApi(defaultClient);
    Integer limit = 25; // Integer | 
    String from = "from_example"; // String | 
    try {
      List<CredentialReceivedCredentials200ResponseInner> result = apiInstance.credentialIncomingCredentials(limit, from);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling CredentialsApi#credentialIncomingCredentials");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **limit** | **Integer**|  | [optional] [default to 25] |
| **from** | **String**|  | [optional] |

### Return type

[**List&lt;CredentialReceivedCredentials200ResponseInner&gt;**](CredentialReceivedCredentials200ResponseInner.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="credentialReceivedCredentials"></a>
# **credentialReceivedCredentials**
> List&lt;CredentialReceivedCredentials200ResponseInner&gt; credentialReceivedCredentials(limit, from)

Get received credentials

This endpoint returns the current user&#39;s received credentials

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.CredentialsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    CredentialsApi apiInstance = new CredentialsApi(defaultClient);
    Integer limit = 25; // Integer | 
    String from = "from_example"; // String | 
    try {
      List<CredentialReceivedCredentials200ResponseInner> result = apiInstance.credentialReceivedCredentials(limit, from);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling CredentialsApi#credentialReceivedCredentials");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **limit** | **Integer**|  | [optional] [default to 25] |
| **from** | **String**|  | [optional] |

### Return type

[**List&lt;CredentialReceivedCredentials200ResponseInner&gt;**](CredentialReceivedCredentials200ResponseInner.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="credentialSendCredential"></a>
# **credentialSendCredential**
> String credentialSendCredential(profileId, credentialSendCredentialRequest)

Send a Credential

This endpoint sends a credential to a user based on their profileId

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.CredentialsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    CredentialsApi apiInstance = new CredentialsApi(defaultClient);
    String profileId = "profileId_example"; // String | 
    CredentialSendCredentialRequest credentialSendCredentialRequest = new CredentialSendCredentialRequest(); // CredentialSendCredentialRequest | 
    try {
      String result = apiInstance.credentialSendCredential(profileId, credentialSendCredentialRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling CredentialsApi#credentialSendCredential");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileId** | **String**|  | |
| **credentialSendCredentialRequest** | [**CredentialSendCredentialRequest**](CredentialSendCredentialRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="credentialSentCredentials"></a>
# **credentialSentCredentials**
> List&lt;CredentialReceivedCredentials200ResponseInner&gt; credentialSentCredentials(limit, to)

Get sent credentials

This endpoint returns the current user&#39;s sent credentials

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.CredentialsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    CredentialsApi apiInstance = new CredentialsApi(defaultClient);
    Integer limit = 25; // Integer | 
    String to = "to_example"; // String | 
    try {
      List<CredentialReceivedCredentials200ResponseInner> result = apiInstance.credentialSentCredentials(limit, to);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling CredentialsApi#credentialSentCredentials");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **limit** | **Integer**|  | [optional] [default to 25] |
| **to** | **String**|  | [optional] |

### Return type

[**List&lt;CredentialReceivedCredentials200ResponseInner&gt;**](CredentialReceivedCredentials200ResponseInner.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

