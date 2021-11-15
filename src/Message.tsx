export default function Message(user: any, message: any, isMe: any) {
   if (user) {
      return (
         <div>
            <p>{message.owner}</p>
            <div>
               <p>{message.message}</p>
            </div>
         </div>
      );
   } else {
      return <p>Loading...</p>;
   }
}
