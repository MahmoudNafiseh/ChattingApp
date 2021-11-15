import * as React from 'react';
import {
   ChakraProvider,
   Box,
   Text,
   Link,
   VStack,
   Code,
   Grid,
   theme,
   Button,
} from '@chakra-ui/react';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import Amplify, {
   Auth,
   withSSRContext,
   API,
   graphqlOperation,
} from 'aws-amplify';
import awsconfig from './aws-exports';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { useEffect, useState } from 'react';
import { listMessages } from './graphql/queries';
import { createMessage } from './graphql/mutations';
import { onCreateMessage } from './graphql/subscriptions';
import Message from './Message';
Amplify.configure({ ...awsconfig, ssr: true });

const App = ({ messages }: any) => {
   const [user, setUser] = useState(null);
   const [stateMessages, setStateMessages] = useState([messages]);
   const [messageText, setMessageText] = useState('');

   useEffect(() => {
      const fetchUser = async () => {
         try {
            const amplifyUser = await Auth.currentAuthenticatedUser();
            setUser(amplifyUser);
         } catch (err) {
            setUser(null);
         }
      };
      fetchUser();
   }, []);
   const handleSubmit = async (e: any) => {
      e.preventDefault();
      setMessageText('');
      const input = {
         message: messageText,

         owner: user?.username,
      };
      try {
         await API.graphql({
            authMode: 'AMAZON_COGNITO_USER_POOLS',
            query: createMessage,
            variables: {
               input: input,
            },
         });
      } catch (err) {
         console.error(err);
      }
      console.log(e.target[0].value);
   };

   const getServerSideProps = async (req?: any) => {
      const SSR = withSSRContext(req);

      try {
         const user = await SSR.Auth.currentAuthenticatedUser();
         const response = await SSR.API.graphql({
            query: listMessages,
            authMode: 'AMAZON_COGNITO_USER_POOLS',
         });
         return {
            props: {
               messages: response.data.listMessages.items,
            },
         };
      } catch (error) {
         return {
            props: {
               messages: [],
            },
         };
      }
   };
   if (user) {
      return (
         <ChakraProvider theme={theme}>
            <Box textAlign='center' fontSize='xl'>
               <Grid minH='100vh' p={3}>
                  <ColorModeSwitcher justifySelf='flex-end' />
                  <VStack spacing={8}>
                     <Text>AWS Live Chat</Text>

                     <div>
                        {stateMessages
                           .sort((a, b) =>
                              b.createdAt.localeCompare(a.createdAt)
                           )
                           .map((message) => (
                              <Message
                                 message={message}
                                 user={user}
                                 isMe={user.username === message.owner}
                                 key={message.id}
                              />
                           ))}
                     </div>
                     <form onSubmit={handleSubmit}>
                        <input
                           type='text'
                           id='message'
                           name='message'
                           autoFocus
                           required
                           placeholder='Send a message'
                           value={messageText}
                           onChange={(e) => setMessageText(e.target.value)}
                        />
                        <Button>Send</Button>
                     </form>
                  </VStack>
               </Grid>
            </Box>
         </ChakraProvider>
      );
   } else
      return (
         <>
            <div>Loading</div>
         </>
      );
};

export default withAuthenticator(App);
